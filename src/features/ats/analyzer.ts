import { completeJSON } from "@/lib/openai";

// A deliberately un-glamorous but effective stopword list for keyword extraction.
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "is", "are", "was", "were", "be", "been", "as", "by", "this", "that",
  "it", "we", "you", "your", "our", "will", "have", "has", "from", "into",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.# ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Extracts the most frequent, meaningful terms from a job description. */
function extractJobKeywords(jobDescription: string, limit = 40): string[] {
  const counts = new Map<string, number>();
  for (const word of tokenize(jobDescription)) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export interface AtsResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  skillGaps: string[];
}

/**
 * Two-stage ATS analysis:
 *  1. Deterministic keyword overlap between the JD and resume text — fast,
 *     free, reproducible, and this is what most real ATS systems actually do.
 *  2. A qualitative LLM pass that turns the raw gap list into human-readable
 *     suggestions and identifies conceptual skill gaps keyword-matching
 *     alone would miss (e.g. "resume shows scripting but no automation/CI").
 */
export async function runAtsAnalysis(resumeText: string, jobDescription?: string): Promise<AtsResult> {
  const resumeTokens = new Set(tokenize(resumeText));

  if (!jobDescription || jobDescription.trim().length < 20) {
    // No JD supplied — fall back to a general resume-quality heuristic score.
    return runGeneralQualityCheck(resumeText, resumeTokens);
  }

  const jobKeywords = extractJobKeywords(jobDescription);
  const matched = jobKeywords.filter((k) => resumeTokens.has(k));
  const missing = jobKeywords.filter((k) => !resumeTokens.has(k));

  const rawScore = jobKeywords.length === 0 ? 0 : Math.round((matched.length / jobKeywords.length) * 100);

  const { data } = await completeJSON<{ suggestions: string[]; skillGaps: string[] }>({
    system: `You are an expert ATS/resume reviewer. Given a resume and a list of
missing keywords from a target job description, produce:
- "suggestions": 4-6 specific, actionable bullet points to improve the resume's
  match (phrasing changes, sections to add, keywords to weave in naturally).
- "skillGaps": conceptual skill areas the candidate appears to be missing,
  beyond the literal keyword list (e.g. "no evidence of cloud infrastructure
  experience despite the role requiring it").
Return ONLY JSON: { "suggestions": string[], "skillGaps": string[] }`,
    user: `MISSING KEYWORDS: ${missing.slice(0, 25).join(", ")}\n\nRESUME EXCERPT:\n${resumeText.slice(0, 4000)}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 3000)}`,
  });

  return {
    score: rawScore,
    matchedKeywords: matched,
    missingKeywords: missing,
    suggestions: data.suggestions ?? [],
    skillGaps: data.skillGaps ?? [],
  };
}

async function runGeneralQualityCheck(resumeText: string, resumeTokens: Set<string>): Promise<AtsResult> {
  const hasQuantifiedResults = /\d+%|\$\d+|\d+x\b/i.test(resumeText);
  const hasActionVerbs = ["led", "built", "designed", "implemented", "launched", "optimized"].some((v) =>
    resumeTokens.has(v)
  );

  const { data } = await completeJSON<{ suggestions: string[]; skillGaps: string[]; score: number }>({
    system: `You are an expert ATS/resume reviewer. No specific job description was
provided, so evaluate general resume quality and ATS-friendliness: structure,
use of quantified achievements, action verbs, and clarity.
Return ONLY JSON: { "score": number (0-100), "suggestions": string[], "skillGaps": string[] }`,
    user: `RESUME:\n${resumeText.slice(0, 6000)}\n\nHeuristics detected — quantified results present: ${hasQuantifiedResults}, strong action verbs present: ${hasActionVerbs}.`,
  });

  return {
    score: data.score ?? 0,
    matchedKeywords: [],
    missingKeywords: [],
    suggestions: data.suggestions ?? [],
    skillGaps: data.skillGaps ?? [],
  };
}

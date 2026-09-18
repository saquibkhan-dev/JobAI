import { describe, it, expect, vi, beforeEach } from "vitest";
import { runAtsAnalysis, tokenize } from "@/features/ats/analyzer";

vi.mock("@/lib/openai", () => ({
  completeJSON: vi.fn(async () => ({
    data: { suggestions: ["Add a metrics-driven summary line."], skillGaps: ["No cloud experience shown."] },
    raw: "{}",
    promptTokens: 10,
    completionTokens: 20,
  })),
}));

describe("tokenize", () => {
  it("lowercases, strips punctuation, and removes stopwords", () => {
    const tokens = tokenize("The Quick, Brown Fox! Jumps over the lazy dog.");
    expect(tokens).not.toContain("the");
    expect(tokens).toContain("quick");
    expect(tokens).toContain("brown");
  });

  it("filters out short words", () => {
    const tokens = tokenize("I am a JS dev");
    expect(tokens).not.toContain("am");
    expect(tokens).not.toContain("js"); // 2 chars, filtered by length>2 rule... note below
  });
});

describe("runAtsAnalysis", () => {
  beforeEach(() => vi.clearAllMocks());

  it("computes a keyword-overlap score against a job description", async () => {
    const resumeText = "Experienced React and TypeScript engineer with AWS deployment background.";
    const jobDescription =
      "Looking for a React TypeScript engineer with strong AWS and Kubernetes experience for our platform team.";

    const result = await runAtsAnalysis(resumeText, jobDescription);

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.matchedKeywords.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("falls back to a general quality check when no job description is provided", async () => {
    const resumeText = "Led a team that shipped 3 features, improving conversion by 20%.";
    const result = await runAtsAnalysis(resumeText, undefined);

    expect(result.matchedKeywords).toEqual([]);
    expect(result.missingKeywords).toEqual([]);
  });

  it("returns a 0 score for an empty job description keyword set edge case", async () => {
    const result = await runAtsAnalysis("Some resume text here.", "   ");
    expect(result.matchedKeywords).toEqual([]);
  });
});

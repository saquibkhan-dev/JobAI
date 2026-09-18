"use client";

import { useState } from "react";
import { useRunAtsAnalysis } from "@/hooks/useAts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import type {
  Resume,
  ResumeExperience,
  ResumeEducation,
  ResumeProject,
  AtsAnalysis,
} from "@prisma/client";

type ResumeWithRelations = Resume & {
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  atsAnalyses: AtsAnalysis[];
};

export function ResumeDetailView({ resume }: { resume: ResumeWithRelations }) {
  const [jobDescription, setJobDescription] = useState("");
  const runAnalysis = useRunAtsAnalysis(resume.id);

  if (resume.status === "PARSING" || resume.status === "PENDING") {
    return <EmptyState title="Parsing in progress" description="This usually takes a few seconds. Refresh shortly." />;
  }

  if (resume.status === "FAILED") {
    return <EmptyState title="Parsing failed" description={resume.parseError ?? "Please try re-uploading the file."} />;
  }

  const latestAnalysis = runAnalysis.data ?? resume.atsAnalyses[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{resume.fullName ?? resume.fileName}</h1>
        <p className="text-muted-foreground">{resume.email} {resume.phone && `· ${resume.phone}`}</p>
      </div>

      {resume.summary && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Summary</h2>
          <p className="text-sm">{resume.summary}</p>
        </section>
      )}

      {resume.skills.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </section>
      )}

      {resume.experiences.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Experience</h2>
          <div className="space-y-3">
            {resume.experiences.map((exp) => (
              <div key={exp.id} className="rounded-lg border p-3">
                <p className="font-medium">{exp.title} · {exp.company}</p>
                <p className="text-xs text-muted-foreground">{exp.startDate} — {exp.endDate ?? "Present"}</p>
                {exp.description && <p className="mt-1 text-sm">{exp.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.education.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Education</h2>
          <div className="space-y-3">
            {resume.education.map((edu) => (
              <div key={edu.id} className="rounded-lg border p-3">
                <p className="font-medium">{edu.institution}</p>
                <p className="text-sm text-muted-foreground">{edu.degree} {edu.field && `in ${edu.field}`}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.projects.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Projects</h2>
          <div className="space-y-3">
            {resume.projects.map((proj) => (
              <div key={proj.id} className="rounded-lg border p-3">
                <p className="font-medium">{proj.name}</p>
                {proj.description && <p className="text-sm">{proj.description}</p>}
                {proj.technologies.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {proj.technologies.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">ATS Analysis</h2>
        <Textarea
          placeholder="Paste a job description to score this resume against it (optional — leave blank for a general quality check)"
          rows={4}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <Button
          className="mt-3"
          onClick={() => runAnalysis.mutate(jobDescription || undefined)}
          disabled={runAnalysis.isPending}
        >
          {runAnalysis.isPending ? "Analyzing..." : "Run ATS Analysis"}
        </Button>

        {runAnalysis.isError && (
          <p className="mt-2 text-sm text-destructive">{(runAnalysis.error as Error).message}</p>
        )}

        {latestAnalysis && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{latestAnalysis.score}</span>
              <span className="text-sm text-muted-foreground">/ 100 ATS Score</span>
            </div>

            {latestAnalysis.missingKeywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Missing Keywords</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {latestAnalysis.missingKeywords.slice(0, 15).map((k) => (
                    <Badge key={k} variant="destructive" className="text-[10px]">{k}</Badge>
                  ))}
                </div>
              </div>
            )}

            {latestAnalysis.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Suggestions</p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                  {latestAnalysis.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {latestAnalysis.skillGaps.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Skill Gaps</p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                  {latestAnalysis.skillGaps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import { resumeRepository, type ResumeListItem } from "@/repositories/resume.repository";
import { JobMatchForm } from "@/features/ai/components/JobMatchForm";

export const metadata: Metadata = {
  title: "AI Job Match Score | JobAI",
};

export default async function JobMatchPage() {
  const user = await requireUser();
  const resumes = await resumeRepository.listByUser(user.id);
  const parsedResumes = resumes.filter((r: ResumeListItem) => r.status === "PARSED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Job Match Score</h1>
        <p className="text-muted-foreground">See how well your resume matches a specific job posting.</p>
      </div>
      <JobMatchForm resumes={parsedResumes.map((r: ResumeListItem) => ({ id: r.id, label: r.fullName ?? r.fileName }))} />
    </div>
  );
}

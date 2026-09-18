import type { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import { resumeRepository, type ResumeListItem } from "@/repositories/resume.repository";
import { CoverLetterForm } from "@/features/ai/components/CoverLetterForm";

export const metadata: Metadata = {
  title: "AI Cover Letter Generator | JobAI",
};

export default async function CoverLetterPage() {
  const user = await requireUser();
  const resumes = await resumeRepository.listByUser(user.id);
  const parsedResumes = resumes.filter((r: ResumeListItem) => r.status === "PARSED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Cover Letter Generator</h1>
        <p className="text-muted-foreground">Tailored to your resume and the job description.</p>
      </div>
      <CoverLetterForm resumes={parsedResumes.map((r: ResumeListItem) => ({ id: r.id, label: r.fullName ?? r.fileName }))} />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { resumeRepository } from "@/repositories/resume.repository";
import { ResumeDetailView } from "@/features/resume/components/ResumeDetailView";

export const metadata: Metadata = {
  title: "Resume Details | JobAI",
};

export default async function ResumeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const resume = await resumeRepository.findById(id, user.id);

  if (!resume) notFound();

  return <ResumeDetailView resume={resume} />;
}

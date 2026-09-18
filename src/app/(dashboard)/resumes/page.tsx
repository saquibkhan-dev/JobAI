import type { Metadata } from "next";
import { ResumesClient } from "@/features/resume/components/ResumesClient";

export const metadata: Metadata = {
  title: "Resumes | JobAI",
  description: "Upload and manage your resumes.",
};

export default function ResumesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumes</h1>
        <p className="text-muted-foreground">Upload a resume to get an ATS score and structured parsing.</p>
      </div>
      <ResumesClient />
    </div>
  );
}

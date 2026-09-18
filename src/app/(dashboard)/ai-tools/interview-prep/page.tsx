import type { Metadata } from "next";
import { InterviewPrepForm } from "@/features/ai/components/InterviewPrepForm";

export const metadata: Metadata = {
  title: "AI Interview Question Generator | JobAI",
};

export default function InterviewPrepPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Interview Prep</h1>
        <p className="text-muted-foreground">Generate likely questions for any role, grouped by category.</p>
      </div>
      <InterviewPrepForm />
    </div>
  );
}

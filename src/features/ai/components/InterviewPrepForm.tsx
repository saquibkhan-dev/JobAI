"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { interviewQuestionsInputSchema, type InterviewQuestionsInput } from "@/features/ai/schemas";
import { generateInterviewQuestionsAction } from "@/features/ai/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { EmptyState } from "@/components/shared/EmptyState";

interface Result {
  behavioral: string[];
  technical: string[];
  companySpecific: string[];
}

export function InterviewPrepForm() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<InterviewQuestionsInput>({
    resolver: zodResolver(interviewQuestionsInputSchema),
    defaultValues: { jobTitle: "", jobDescription: "" },
  });

  async function onSubmit(values: InterviewQuestionsInput) {
    setError(null);
    setResult(null);
    const res = await generateInterviewQuestionsAction(values);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setResult(res.data);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description</FormLabel>
                <FormControl><Textarea rows={10} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Generating..." : "Generate Questions"}
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        {!result ? (
          <div className="rounded-xl border p-4">
            <EmptyState compact title="Nothing generated yet" description="Paste a job description to get started." />
          </div>
        ) : (
          <>
            <QuestionGroup title="Behavioral" questions={result.behavioral} />
            <QuestionGroup title="Technical" questions={result.technical} />
            <QuestionGroup title="Company-Specific" questions={result.companySpecific} />
          </>
        )}
      </div>
    </div>
  );
}

function QuestionGroup({ title, questions }: { title: string; questions: string[] }) {
  if (questions.length === 0) return null;
  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{title}</h3>
      <ol className="list-inside list-decimal space-y-2 text-sm">
        {questions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ol>
    </div>
  );
}

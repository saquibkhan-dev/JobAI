"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobMatchInputSchema, type JobMatchInput } from "@/features/ai/schemas";
import { computeJobMatchAction } from "@/features/ai/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";

interface Result {
  score: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export function JobMatchForm({ resumes }: { resumes: { id: string; label: string }[] }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<JobMatchInput>({
    resolver: zodResolver(jobMatchInputSchema),
    defaultValues: { resumeId: resumes[0]?.id ?? "", jobDescription: "" },
  });

  async function onSubmit(values: JobMatchInput) {
    setError(null);
    setResult(null);
    const res = await computeJobMatchAction(values);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setResult(res.data);
  }

  if (resumes.length === 0) {
    return <EmptyState title="Upload a resume first" description="You need a fully parsed resume to compute a match score." />;
  }

  const scoreColor = !result ? "" : result.score >= 75 ? "text-green-600" : result.score >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="resumeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resume</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a resume" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {resumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            {form.formState.isSubmitting ? "Scoring..." : "Compute Match Score"}
          </Button>
        </form>
      </Form>

      <div className="rounded-xl border p-4">
        {!result ? (
          <EmptyState compact title="Nothing computed yet" description="Select a resume and paste a job description." />
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <span className={`text-5xl font-bold ${scoreColor}`}>{result.score}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <p className="text-center text-sm">{result.recommendation}</p>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Strengths</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Gaps</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                {result.gaps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

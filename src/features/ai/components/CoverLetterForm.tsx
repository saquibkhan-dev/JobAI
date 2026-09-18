"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { coverLetterInputSchema, type CoverLetterInput } from "@/features/ai/schemas";
import { generateCoverLetterAction } from "@/features/ai/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";

export function CoverLetterForm({ resumes }: { resumes: { id: string; label: string }[] }) {
  const [letter, setLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CoverLetterInput>({
    resolver: zodResolver(coverLetterInputSchema),
    defaultValues: {
      resumeId: resumes[0]?.id ?? "",
      jobTitle: "",
      companyName: "",
      jobDescription: "",
      tone: "professional",
    },
  });

  async function onSubmit(values: CoverLetterInput) {
    setError(null);
    setLetter(null);
    const result = await generateCoverLetterAction(values);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setLetter(result.data.letter);
  }

  if (resumes.length === 0) {
    return (
      <EmptyState
        title="Upload a resume first"
        description="You need at least one fully parsed resume before generating a cover letter."
      />
    );
  }

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
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resume" />
                    </SelectTrigger>
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
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tone</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description</FormLabel>
                <FormControl><Textarea rows={8} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Generating..." : "Generate Cover Letter"}
          </Button>
        </form>
      </Form>

      <div className="rounded-xl border p-4">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Result</h3>
        {letter ? (
          <pre className="whitespace-pre-wrap font-sans text-sm">{letter}</pre>
        ) : (
          <EmptyState compact title="Nothing generated yet" description="Fill out the form and generate your cover letter." />
        )}
      </div>
    </div>
  );
}

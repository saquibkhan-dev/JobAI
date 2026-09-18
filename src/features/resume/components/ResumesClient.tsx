"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useResumes, useUploadResume, useDeleteResume } from "@/hooks/useResume";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Search } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  PARSING: "secondary",
  PARSED: "default",
  FAILED: "destructive",
};

interface ResumeListItem {
  id: string;
  fileName: string;
  status: string;
  fullName: string | null;
  isPrimary: boolean;
  createdAt: string;
  atsAnalyses: { score: number }[];
}

export function ResumesClient() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  // Debounced so typing doesn't fire a DB query on every keystroke — only
  // once the user pauses for 300ms.
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const { data, isLoading, isFetching } = useResumes(debouncedSearch, page);
  const upload = useUploadResume();
  const deleteResume = useDeleteResume();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1); // reset pagination whenever the search term changes
  }

  const resumes = (data?.resumes ?? []) as ResumeListItem[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resumes..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
          <Upload className="mr-2 h-4 w-4" />
          {upload.isPending ? "Uploading..." : "Upload Resume"}
        </Button>
      </div>

      {upload.isError && (
        <p className="text-sm text-destructive">{(upload.error as Error).message}</p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? "No matching resumes" : "No resumes yet"}
          description={
            debouncedSearch
              ? "Try a different search term."
              : "Upload your first resume to get started with ATS scoring."
          }
        />
      ) : (
        <div className={`space-y-2 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {resumes.map((resume) => (
            <div key={resume.id} className="flex items-center justify-between rounded-xl border p-4">
              <Link href={`/resumes/${resume.id}`} className="flex-1">
                <p className="font-medium">{resume.fullName ?? resume.fileName}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[resume.status] ?? "secondary"}>{resume.status}</Badge>
                  {resume.atsAnalyses[0] && (
                    <span className="text-xs text-muted-foreground">
                      ATS Score: {resume.atsAnalyses[0].score}/100
                    </span>
                  )}
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteResume.mutate(resume.id)}
                disabled={deleteResume.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {(page > 1 || data?.hasMore) && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

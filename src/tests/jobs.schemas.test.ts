import { describe, it, expect } from "vitest";
import { createApplicationSchema, updateApplicationStatusSchema } from "@/features/jobs/schemas";

describe("createApplicationSchema", () => {
  it("accepts a minimal valid application", () => {
    const result = createApplicationSchema.safeParse({
      companyName: "Acme Inc.",
      jobTitle: "Senior Engineer",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing company name", () => {
    const result = createApplicationSchema.safeParse({
      companyName: "",
      jobTitle: "Senior Engineer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid job URL", () => {
    const result = createApplicationSchema.safeParse({
      companyName: "Acme Inc.",
      jobTitle: "Senior Engineer",
      jobUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("allows an empty job URL (optional field)", () => {
    const result = createApplicationSchema.safeParse({
      companyName: "Acme Inc.",
      jobTitle: "Senior Engineer",
      jobUrl: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateApplicationStatusSchema", () => {
  it("rejects an invalid status value", () => {
    const result = updateApplicationStatusSchema.safeParse({ id: "clabc123", status: "IN_PROGRESS" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid status transition payload", () => {
    const result = updateApplicationStatusSchema.safeParse({
      id: "clabcdefghijklmnopqrstuv",
      status: "INTERVIEW",
    });
    expect(result.success).toBe(true);
  });
});

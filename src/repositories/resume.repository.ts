import { db } from "@/lib/db";
import type { Prisma, ResumeStatus } from "@prisma/client";

const resumeListSelect = {
  id: true,
  fileName: true,
  status: true,
  fullName: true,
  isPrimary: true,
  createdAt: true,
  atsAnalyses: { orderBy: { createdAt: "desc" as const }, take: 1, select: { score: true } },
} satisfies Prisma.ResumeSelect;

export type ResumeListItem = Prisma.ResumeGetPayload<{ select: typeof resumeListSelect }>;

/**
 * Repository Pattern: this is the ONLY module allowed to call `db.resume.*`.
 * Server Actions, AI services, and the ATS engine all depend on this
 * interface, never on Prisma directly. Benefits:
 *  - Swap Prisma for another ORM/data source without touching business logic.
 *  - Unit-test services by mocking this module (no test DB required).
 *  - One place to enforce tenant isolation (`userId` scoping) consistently.
 */
export const resumeRepository = {
  async create(userId: string, data: { fileName: string; fileUrl: string; fileType: string }) {
    return db.resume.create({ data: { userId, ...data } });
  },

  async findById(id: string, userId: string) {
    return db.resume.findFirst({
      where: { id, userId },
      include: {
        experiences: { orderBy: { order: "asc" } },
        education: { orderBy: { order: "asc" } },
        projects: { orderBy: { order: "asc" } },
        atsAnalyses: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
  },

  async listByUser(userId: string, options?: { search?: string; take?: number; skip?: number }): Promise<ResumeListItem[]> {
    const { search, take = 20, skip = 0 } = options ?? {};
    return db.resume.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { fileName: { contains: search, mode: "insensitive" } },
                { fullName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: resumeListSelect,
    });
  },

  async updateStatus(id: string, status: ResumeStatus, parseError?: string) {
    return db.resume.update({ where: { id }, data: { status, parseError } });
  },

  /** Persists the full structured extraction produced by the parsing service. */
  async saveParsedData(
    id: string,
    parsed: {
      fullName?: string;
      email?: string;
      phone?: string;
      skills: string[];
      summary?: string;
      rawText: string;
      experiences: Omit<Prisma.ResumeExperienceCreateManyInput, "resumeId">[];
      education: Omit<Prisma.ResumeEducationCreateManyInput, "resumeId">[];
      projects: Omit<Prisma.ResumeProjectCreateManyInput, "resumeId">[];
    }
  ) {
    return db.$transaction(async (tx) => {
      await tx.resumeExperience.deleteMany({ where: { resumeId: id } });
      await tx.resumeEducation.deleteMany({ where: { resumeId: id } });
      await tx.resumeProject.deleteMany({ where: { resumeId: id } });

      return tx.resume.update({
        where: { id },
        data: {
          status: "PARSED",
          fullName: parsed.fullName,
          email: parsed.email,
          phone: parsed.phone,
          skills: parsed.skills,
          summary: parsed.summary,
          rawText: parsed.rawText,
          experiences: { createMany: { data: parsed.experiences } },
          education: { createMany: { data: parsed.education } },
          projects: { createMany: { data: parsed.projects } },
        },
      });
    });
  },

  async delete(id: string, userId: string) {
    return db.resume.deleteMany({ where: { id, userId } });
  },
};

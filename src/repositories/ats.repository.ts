import { db } from "@/lib/db";

export const atsRepository = {
  async create(
    resumeId: string,
    data: {
      jobDescription?: string;
      score: number;
      missingKeywords: string[];
      matchedKeywords: string[];
      suggestions: string[];
      skillGaps: string[];
    }
  ) {
    return db.atsAnalysis.create({ data: { resumeId, ...data } });
  },

  /** For the dashboard's ATS score trend chart. */
  async getTrendForUser(userId: string, limit = 30) {
    return db.atsAnalysis.findMany({
      where: { resume: { userId } },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { score: true, createdAt: true },
    });
  },

  async getLatestForResume(resumeId: string) {
    return db.atsAnalysis.findFirst({ where: { resumeId }, orderBy: { createdAt: "desc" } });
  },
};

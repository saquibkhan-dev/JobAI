import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Password123!", 12);

  const user = await db.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      hashedPassword,
      role: "USER",
    },
  });

  const resume = await db.resume.create({
    data: {
      userId: user.id,
      fileName: "demo-resume.pdf",
      fileUrl: "demo/demo-resume.pdf",
      fileType: "application/pdf",
      status: "PARSED",
      fullName: "Demo User",
      email: "demo@example.com",
      skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
      summary: "Full-stack engineer with 5 years of experience building web applications.",
      isPrimary: true,
      experiences: {
        create: [
          {
            company: "TechCorp",
            title: "Senior Software Engineer",
            startDate: "2022",
            endDate: "Present",
            description: "Led migration to microservices, improving deploy frequency by 3x.",
            order: 0,
          },
        ],
      },
      education: {
        create: [{ institution: "State University", degree: "B.S.", field: "Computer Science", order: 0 }],
      },
    },
  });

  await db.atsAnalysis.create({
    data: {
      resumeId: resume.id,
      score: 78,
      matchedKeywords: ["typescript", "react", "aws"],
      missingKeywords: ["kubernetes", "graphql"],
      suggestions: ["Add measurable impact to your most recent role.", "Include a link to a portfolio or GitHub."],
      skillGaps: ["No container orchestration experience shown."],
    },
  });

  await db.jobApplication.create({
    data: {
      userId: user.id,
      resumeId: resume.id,
      companyName: "Acme Inc.",
      jobTitle: "Senior Frontend Engineer",
      status: "APPLIED",
      appliedAt: new Date(),
    },
  });

  console.log("Seed complete:", { userId: user.id, resumeId: resume.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/rbac";
import { resumeRepository } from "@/repositories/resume.repository";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

    const resumes = await resumeRepository.listByUser(user.id, {
      search,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    });

    // hasMore lets the client know whether to show "Load more" without a
    // separate COUNT(*) query on every request.
    return NextResponse.json({ resumes, hasMore: resumes.length === PAGE_SIZE });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTx = {
  jobApplication: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
  applicationStatusEvent: { create: vi.fn() },
};

vi.mock("@/lib/db", () => ({
  db: {
    jobApplication: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    applicationStatusEvent: { create: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: typeof mockTx) => unknown) => fn(mockTx)),
  },
}));

import { db } from "@/lib/db";
import { applicationRepository } from "@/repositories/application.repository";

describe("applicationRepository.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates the application and logs a WISHLIST status event in one transaction", async () => {
    mockTx.jobApplication.create.mockResolvedValue({ id: "app_1", status: "WISHLIST" });

    const result = await applicationRepository.create("user_1", {
      companyName: "Acme",
      jobTitle: "Engineer",
    });

    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(mockTx.jobApplication.create).toHaveBeenCalledWith({
      data: { userId: "user_1", companyName: "Acme", jobTitle: "Engineer", status: "WISHLIST" },
    });
    expect(mockTx.applicationStatusEvent.create).toHaveBeenCalledWith({
      data: { applicationId: "app_1", toStatus: "WISHLIST" },
    });
    expect(result).toEqual({ id: "app_1", status: "WISHLIST" });
  });
});

describe("applicationRepository.updateStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when the application does not belong to the user", async () => {
    vi.mocked(db.jobApplication.findFirst).mockResolvedValue(null);
    const result = await applicationRepository.updateStatus("app_1", "user_1", "APPLIED");
    expect(result).toBeNull();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("stamps appliedAt when transitioning to APPLIED", async () => {
    vi.mocked(db.jobApplication.findFirst).mockResolvedValue({
      id: "app_1",
      status: "WISHLIST",
      appliedAt: null,
      interviewAt: null,
    } as never);
    mockTx.jobApplication.update.mockResolvedValue({ id: "app_1", status: "APPLIED" });

    await applicationRepository.updateStatus("app_1", "user_1", "APPLIED");

    expect(mockTx.jobApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "APPLIED", appliedAt: expect.any(Date) }),
      })
    );
  });
});

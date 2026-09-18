import { auth } from "@/app/api/auth/[...nextauth]/route";

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in to do this.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do this.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Call at the top of any Server Action / Route Handler that touches user
 * data. Throws instead of silently returning null so calling code can rely
 * on the return type being non-nullable.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user;
}

export async function requireRole(role: "ADMIN") {
  const user = await requireUser();
  if (user.role !== role) throw new ForbiddenError();
  return user;
}

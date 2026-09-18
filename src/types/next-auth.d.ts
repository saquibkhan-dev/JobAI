import type { DefaultSession } from "next-auth";

// The `jwt`/`session` callbacks in lib/auth.ts always set `id` and `role` on
// sign-in, so every consumer of `auth()` can rely on them being present —
// without this augmentation, NextAuth's default types mark `id` optional and
// omit `role` entirely, which cascades into spurious `string | undefined`
// errors throughout every Server Action that calls `requireUser()`.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN";
  }
}

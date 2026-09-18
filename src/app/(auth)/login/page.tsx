import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Log In | JobAI",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Log in to continue your job search.</p>
          <p className="text-sm text-muted-foreground">demo@example.com / Password123!</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

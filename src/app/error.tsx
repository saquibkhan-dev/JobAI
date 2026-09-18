"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Send to your error monitoring provider (Sentry, etc.)
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        We hit an unexpected error loading this page. You can try again, and if the problem
        persists, please contact support.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

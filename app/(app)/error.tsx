"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto mt-10 max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-[var(--muted-foreground)]">The workspace could not load. Try again, and if the issue persists check your Neon and Clerk configuration.</p>
      <Button onClick={reset}>Try again</Button>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const json = (await response.json().catch(() => null)) as { error?: string; redirectTo?: string } | null;

    if (!response.ok) {
      setError(json?.error ?? "Could not reset password");
      setLoading(false);
      return;
    }

    router.push(json?.redirectTo ?? "/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Choose new password</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Your reset link expires after 30 minutes.</p>
        </div>

        {!token ? <Badge tone="danger" className="w-fit">Missing reset token</Badge> : null}
        {error ? <Badge tone="danger" className="w-fit">{error}</Badge> : null}

        <form className="space-y-3" onSubmit={onSubmit}>
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            type="password"
          />
          <Button className="w-full" disabled={loading || !token}>
            {loading ? "Saving..." : "Reset password"}
          </Button>
        </form>

        <Link href="/login" className="block text-sm font-medium text-[var(--primary)]">
          Back to sign in
        </Link>
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

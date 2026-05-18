"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setMessage(null);
    setResetUrl(null);
    setError(null);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const json = (await response.json().catch(() => null)) as { error?: string; resetUrl?: string } | null;
    setLoading(false);

    if (!response.ok) {
      setError(json?.error ?? "Could not start password reset");
      return;
    }

    setMessage("If an account exists for this email, a reset link has been sent.");
    setResetUrl(json?.resetUrl ?? null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Reset password</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Enter your owner email to create a secure reset link.</p>
        </div>

        {error ? <Badge tone="danger" className="w-fit">{error}</Badge> : null}
        {message ? <Badge tone="success" className="w-fit">{message}</Badge> : null}

        <form className="space-y-3" onSubmit={onSubmit}>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" required />
          <Button className="w-full" disabled={loading}>
            {loading ? "Creating link..." : "Create reset link"}
          </Button>
        </form>

        {resetUrl ? (
          <Link href={resetUrl} className="block text-sm font-medium text-[var(--primary)]">
            Open development reset link
          </Link>
        ) : null}

        <Link href="/login" className="block text-sm font-medium text-[var(--primary)]">
          Back to sign in
        </Link>
      </Card>
    </main>
  );
}

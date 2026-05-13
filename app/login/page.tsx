"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = (await res.json().catch(() => null)) as { error?: string; redirectTo?: string } | null;

    if (!res.ok) {
      setError(json?.error ?? "Invalid owner credentials");
      setLoading(false);
      return;
    }

    router.replace(json?.redirectTo ?? "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Sign in to your salon workspace.
          </p>
        </div>

        {error ? (
          <Badge tone="danger" className="w-fit">
            {error}
          </Badge>
        ) : null}

        <form className="space-y-3" onSubmit={onSubmit}>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
          <Button className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-sm text-[var(--muted-foreground)]">
          <Link href="/forgot-password" className="font-medium text-[var(--primary)]">
            Forgot password?
          </Link>
        </p>

        <p className="text-sm text-[var(--muted-foreground)]">
          No account?{" "}
          <Link href="/register" className="font-medium text-[var(--primary)]">
            Start your free trial
          </Link>
        </p>
      </Card>
    </main>
  );
}

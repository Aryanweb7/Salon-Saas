"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [salonName, setSalonName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonName, ownerName, email, phone, city, password }),
    });

    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      setError(json?.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const login = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const loginJson = (await login.json().catch(() => null)) as { redirectTo?: string } | null;
    router.replace(loginJson?.redirectTo ?? json?.redirectTo ?? "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl space-y-5">
        <Link href="/" className="inline-flex w-fit text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          Back
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Create your SalonFlow workspace</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Create an owner account. Choose a paid plan after signing in.</p>
        </div>

        {error ? (
          <Badge tone="danger" className="w-fit">
            {error}
          </Badge>
        ) : null}

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={salonName} onChange={(e) => setSalonName(e.target.value)} placeholder="Salon name" />
            <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose password" type="password" />
          </div>
          <Button className="w-full" disabled={loading}>
            {loading ? "Creating workspace..." : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-[var(--muted-foreground)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--primary)]">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}

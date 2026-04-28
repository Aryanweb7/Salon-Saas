import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function LoginPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-5">
        <div>
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Sign in with Supabase Auth or Clerk. Demo screen uses placeholder form values.</p>
        </div>
        <div className="space-y-3">
          <Input placeholder="owner@salon.com" />
          <Input placeholder="Password" type="password" />
        </div>
        <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
          <Button className="w-full">Login to Salon Dashboard</Button>
        </SignInButton>
        <SignInButton mode="modal" fallbackRedirectUrl="/admin">
          <Button className="w-full" variant="outline">Login as Super Admin</Button>
        </SignInButton>
        <p className="text-sm text-[var(--muted-foreground)]">No account? <Link href="/register" className="font-medium text-[var(--primary)]">Start your free trial</Link></p>
      </Card>
    </main>
  );
}

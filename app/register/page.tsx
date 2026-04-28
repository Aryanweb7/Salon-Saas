import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignUpButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function RegisterPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl space-y-5">
        <div>
          <h1 className="text-3xl font-semibold">Create your SalonFlow workspace</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">This onboarding form maps to `salons`, `branches`, `users`, and `subscriptions` during real signup.</p>
        </div>
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Salon name" />
            <Input placeholder="Owner name" />
            <Input placeholder="Email" />
            <Input placeholder="Phone" />
            <Input placeholder="City" />
            <Input placeholder="Choose password" type="password" />
          </div>
          <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
            <Button className="w-full">Start 14-day free trial</Button>
          </SignUpButton>
        </div>
      </Card>
    </main>
  );
}

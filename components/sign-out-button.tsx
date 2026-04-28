"use client";

import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export function CustomSignOutButton() {
  return (
    <SignOutButton redirectUrl="/login">
      <button className="flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border border-[var(--border)] bg-transparent hover:bg-[var(--muted)] transition">
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    </SignOutButton>
  );
}

"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { activatePremiumForTestingAction } from "@/app/actions/subscriptions";
import { Button } from "@/components/ui/button";

export function TestingPremiumButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await activatePremiumForTestingAction();

          if (result.success) {
            toast.success("Premium activated for testing");
            window.location.reload();
            return;
          }

          toast.error(result.error ?? "Failed to activate Premium");
        })
      }
    >
      {isPending ? "Activating..." : "Activate Premium for testing"}
    </Button>
  );
}

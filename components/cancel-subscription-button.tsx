"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { cancelSubscriptionAction } from "@/app/actions/subscriptions";
import { Button } from "@/components/ui/button";

export function CancelSubscriptionButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await cancelSubscriptionAction();

          if (result.success) {
            toast.success(result.warning ?? "Subscription canceled");
            window.location.reload();
            return;
          }

          toast.error(result.error ?? "Failed to cancel subscription");
        })
      }
    >
      {isPending ? "Canceling..." : "Cancel subscription"}
    </Button>
  );
}

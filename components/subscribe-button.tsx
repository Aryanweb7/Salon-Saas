"use client";

import { useEffect, useState } from "react";
import { initiateSubscriptionAction, verifySubscriptionPaymentAction } from "@/app/actions/subscriptions";
import { Button } from "@/components/ui/button";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler?: (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => void;
}

declare global {
  interface Window {
    Razorpay?: {
      new (options: RazorpayOptions): {
        open: () => void;
        close: () => void;
      };
    };
  }
}

interface SubscribeButtonProps {
  planId: "basic" | "pro";
  isLoading?: boolean;
  className?: string;
  label?: string;
  redirectTo?: string;
}

function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');

  if (existingScript) {
    return new Promise<boolean>((resolve) => {
      existingScript.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
    });
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function SubscribeButton({ planId, isLoading = false, className, label, redirectTo = "/billing" }: SubscribeButtonProps) {
  const plan = PLAN_DEFINITIONS[planId];
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const [isCheckoutReady, setIsCheckoutReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadRazorpayCheckout().then((ready) => {
      if (isMounted) {
        setIsCheckoutReady(ready);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = async () => {
    try {
      if (!razorpayKey) {
        toast.error("Razorpay public key is not configured in this deployment.");
        return;
      }

      const checkoutReady = isCheckoutReady || await loadRazorpayCheckout();

      if (!checkoutReady || !window.Razorpay) {
        toast.error("Razorpay checkout could not be loaded. Please refresh and try again.");
        return;
      }

      const result = await initiateSubscriptionAction({ planId });

      if (!result.success || !result.subscriptionId || !result.salonName || !result.email || !result.planId) {
        toast.error(result.error || "Failed to initiate subscription");
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKey,
        subscription_id: result.subscriptionId,
        name: "SalonFlow",
        description: `${plan.name} plan - ${plan.billingInterval === "year" ? "annual" : "monthly"} auto-renewal`,
        prefill: {
          name: result.salonName,
          email: result.email,
        },
        theme: {
          color: "#3b82f6",
        },
        handler: async (response) => {
          try {
            const verifyResult = await verifySubscriptionPaymentAction({
              subscriptionId: response.razorpay_subscription_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyResult.success) {
              toast.success(verifyResult.message ?? "Subscription updated successfully.");
              window.location.href = redirectTo;
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            toast.error("Failed to verify payment");
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <Button 
      onClick={handleSubscribe} 
      disabled={isLoading || !razorpayKey}
      className={cn(className)}
    >
      {label ?? (planId === "pro" ? "Start Annual Plan" : "Subscribe Now")}
    </Button>
  );
}


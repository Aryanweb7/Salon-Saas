"use client";

import { useEffect } from "react";
import { initiateSubscriptionAction, verifySubscriptionPaymentAction } from "@/app/actions/subscriptions";
import { Button } from "@/components/ui/button";
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
    Razorpay: {
      new (options: RazorpayOptions): {
        open: () => void;
        close: () => void;
      };
    };
  }
}

interface SubscribeButtonProps {
  planId: "basic" | "pro" | "premium";
  isLoading?: boolean;
  className?: string;
}

export function SubscribeButton({ planId, isLoading = false, className }: SubscribeButtonProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async () => {
    try {
      const result = await initiateSubscriptionAction({ planId });

      if (!result.success || !result.subscriptionId || !result.salonName || !result.email || !result.planId) {
        toast.error(result.error || "Failed to initiate subscription");
        return;
      }

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        subscription_id: result.subscriptionId,
        name: "SalonFlow",
        description: `Subscribe to ${planId.toUpperCase()} plan`,
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
              toast.success("Subscription activated successfully!");
              window.location.href = "/app/billing";
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
      disabled={isLoading || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
      className={cn(className)}
    >
      Start 14-day free trial
    </Button>
  );
}


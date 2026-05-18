"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CustomerFilter = "all" | "birthday";

interface CampaignResult {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  failedRecipients?: Array<{ name: string; phone: string; reason: string }>;
  error?: string;
}

const defaultMessage = `Special Offer!

Hi {{customer_name}},

Enjoy 20% OFF on your next salon visit.

Book your appointment today.`;

export function SendOfferCampaignButton() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [message, setMessage] = useState(defaultMessage);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function sendCampaign() {
    const body = message.trim();

    if (!body) {
      toast.error("Message is required");
      return;
    }

    setResult(null);
    startTransition(async () => {
      const response = await fetch("/api/send-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter, message: body }),
      });
      const data = (await response.json().catch(() => null)) as CampaignResult | null;

      if (!response.ok) {
        toast.error(data?.error ?? "Failed to send WhatsApp campaign");
        return;
      }

      setResult(data);
      toast.success(`Campaign sent to ${data?.sent ?? 0} customer(s)`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="mr-2 h-4 w-4" />
          Send Offer Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Offer Campaign</DialogTitle>
          <DialogDescription>
            Send a WhatsApp campaign to selected salon customers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Recipients</p>
            <Select value={filter} onValueChange={(value) => setFilter(value as CustomerFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                <SelectItem value="birthday">Birthday customers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Message</p>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={500}
              rows={7}
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              Use {"{{customer_name}}"} to personalize each WhatsApp message. {message.length}/500 characters.
            </p>
          </div>

          {result ? (
            <div className="space-y-3 rounded-2xl border p-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[var(--muted-foreground)]">Sent</p>
                  <p className="text-lg font-semibold">{result.sent}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Failed</p>
                  <p className="text-lg font-semibold">{result.failed}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Skipped</p>
                  <p className="text-lg font-semibold">{result.skipped}</p>
                </div>
              </div>

              {result.failedRecipients?.length ? (
                <div className="rounded-xl bg-red-50 p-3 text-red-700">
                  <p className="font-medium">Failed numbers</p>
                  <ul className="mt-2 space-y-1">
                    {result.failedRecipients.map((recipient) => (
                      <li key={`${recipient.phone}-${recipient.name}`}>
                        {recipient.name} ({recipient.phone}): {recipient.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendCampaign} disabled={isPending || !message.trim()}>
              {isPending ? "Sending..." : "Send WhatsApp"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { Gift, Mail, Send, Sparkles, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Audience = "all" | "new" | "inactive" | "birthday";
type PlanId = "free" | "basic" | "pro";

interface AudienceStat {
  id: Audience;
  label: string;
  count: number;
  description: string;
}

interface CampaignResult {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  failedRecipients?: Array<{ name: string; reason: string }>;
  error?: string;
  upgradeRequired?: boolean;
}

interface Template {
  id: string;
  title: string;
  label: string;
  message: string;
}

const templates: Template[] = [
  {
    id: "festival",
    label: "Festival Offer",
    title: "Festival glow-up offer",
    message: "Hi {{customer_name}}, celebrate with {{salon_name}} and enjoy 20% off on your next hair spa appointment this week.",
  },
  {
    id: "hair-spa",
    label: "Hair Spa Discount",
    title: "Flat 20% off on Hair Spa",
    message: "Hi {{customer_name}}, your hair spa offer is ready at {{salon_name}}. Book today and get a softer, shinier finish.",
  },
  {
    id: "bridal",
    label: "Bridal Package",
    title: "Bridal beauty package",
    message: "Hi {{customer_name}}, explore bridal makeup, hair styling, and pre-wedding grooming packages at {{salon_name}}.",
  },
  {
    id: "weekend",
    label: "Weekend Offer",
    title: "Weekend salon refresh",
    message: "Hi {{customer_name}}, weekend slots are open at {{salon_name}}. Reserve your appointment and enjoy a special package price.",
  },
];

function renderPreview(value: string, salonName: string) {
  return value
    .replace(/\{\{\s*customer_name\s*\}\}/gi, "Priya")
    .replace(/\{\{\s*salon_name\s*\}\}/gi, salonName);
}

export function MarketingCampaignBuilder({
  salonName,
  audienceStats,
  planName,
  planId,
  emailLimit,
  emailsSentThisMonth,
}: {
  salonName: string;
  audienceStats: AudienceStat[];
  planName: string;
  planId: PlanId;
  emailLimit: number | null;
  emailsSentThisMonth: number;
}) {
  const [title, setTitle] = useState(templates[1].title);
  const [message, setMessage] = useState(templates[1].message);
  const [audience, setAudience] = useState<Audience>("all");
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAudience = audienceStats.find((item) => item.id === audience);
  const remainingEmails = emailLimit === null ? null : Math.max(emailLimit - emailsSentThisMonth, 0);
  const limitReached = remainingEmails !== null && remainingEmails <= 0;
  const shouldShowUpgradePrompt = planId === "free" || planId === "basic";
  const previewTitle = useMemo(() => renderPreview(title, salonName), [title, salonName]);
  const previewMessage = useMemo(() => renderPreview(message, salonName), [message, salonName]);

  function applyTemplate(template: Template) {
    setTitle(template.title);
    setMessage(template.message);
    setResult(null);
  }

  function sendCampaign() {
    setResult(null);

    startTransition(async () => {
      const response = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, audience }),
      });
      const data = (await response.json().catch(() => null)) as CampaignResult | null;

      if (!response.ok) {
        toast.error(data?.error ?? "Failed to send campaign");
        return;
      }

      setResult(data);
      toast.success(`Campaign sent to ${data?.sent ?? 0} customer(s)`);
    });
  }

  return (
    <div className="min-w-0 space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Marketing</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Create Campaign</h1>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Build a polished offer, preview it live, choose the right audience, and send it through email.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">{selectedAudience?.count ?? 0} selected</Badge>
          <Badge>Email</Badge>
          <Badge tone={limitReached ? "danger" : "warning"}>
            {emailLimit === null ? "Unlimited emails" : `${remainingEmails} emails left`}
          </Badge>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Templates</CardTitle>
                <CardDescription>Start from a salon-ready campaign.</CardDescription>
              </div>
              <Sparkles className="h-5 w-5 text-[var(--primary)]" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="rounded-2xl border bg-[var(--background)] p-4 text-left"
                >
                  <p className="break-words font-semibold">{template.label}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">{template.title}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>Offer Details</CardTitle>
            <CardDescription>Use {"{{customer_name}}"} and {"{{salon_name}}"} for personalization.</CardDescription>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-title">Offer title</Label>
                <Input
                  id="campaign-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={140}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-message">Message</Label>
                <Textarea
                  id="campaign-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={8}
                  maxLength={800}
                />
                <p className="text-xs text-[var(--muted-foreground)]">{message.length}/800 characters</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Audience</CardTitle>
            <CardDescription>Select who should receive this offer.</CardDescription>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {audienceStats.map((item) => {
                const locked = item.id === "birthday" && planId !== "pro";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!locked) setAudience(item.id);
                    }}
                    disabled={locked}
                    className={cn(
                      "rounded-2xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-60",
                      audience === item.id ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" : "bg-transparent",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="break-words font-semibold">{item.label}</p>
                      <Badge>{item.count}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">{locked ? "Birthday-only campaigns are available on Pro." : item.description}</p>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-5 xl:sticky xl:top-8 xl:self-start">
          <Card className={limitReached ? "border-[var(--danger)]/40 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Email Usage</CardTitle>
                <CardDescription>
                  {emailsSentThisMonth} of {emailLimit ?? "unlimited"} campaign emails used this month on {planName}.
                </CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{
                  width: emailLimit ? `${Math.min((emailsSentThisMonth / emailLimit) * 100, 100)}%` : "100%",
                }}
              />
            </div>
            {shouldShowUpgradePrompt ? (
              <div className="mt-4 rounded-2xl border bg-[var(--background)]/70 p-4 text-sm">
                <p className="font-semibold">Need more campaign emails?</p>
                <p className="mt-1 text-[var(--muted-foreground)]">
                  Upgrade your plan to increase your monthly email campaign limit.
                </p>
                <Button asChild className="mt-3 w-full" variant={limitReached ? "default" : "outline"}>
                  <a href="/billing">Upgrade plan</a>
                </Button>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardTitle>Send Via</CardTitle>
            <div className="mt-5 rounded-2xl border border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] px-4 py-3 text-sm font-semibold">
              <div className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b bg-[var(--muted)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>Inbox preview</CardDescription>
                </div>
                <Mail className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-2xl border bg-[var(--background)] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">
                    {salonName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{salonName}</p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      bookings@salonflow.com
                    </p>
                  </div>
                </div>

                <h2 className="break-words text-xl font-semibold sm:text-2xl">{previewTitle || "Campaign title"}</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">
                  {previewMessage || "Your message preview will appear here."}
                </p>

                <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[var(--muted)] p-3 text-sm">
                  <Gift className="h-4 w-4" />
                  <span className="min-w-0 break-words">Audience: {selectedAudience?.label ?? "All Customers"}</span>
                </div>
              </div>

              {result ? (
                <div className="mt-4 grid gap-3 text-center text-sm sm:grid-cols-3">
                  <div className="rounded-2xl border p-3">
                    <p className="text-[var(--muted-foreground)]">Sent</p>
                    <p className="text-xl font-semibold">{result.sent}</p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-[var(--muted-foreground)]">Skipped</p>
                    <p className="text-xl font-semibold">{result.skipped}</p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-[var(--muted-foreground)]">Failed</p>
                    <p className="text-xl font-semibold">{result.failed}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" className="flex-1">
                  <Users className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={isPending || limitReached || !title.trim() || !message.trim()}
                  onClick={sendCampaign}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isPending ? "Sending..." : "Send Campaign"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

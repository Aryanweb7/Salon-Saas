import { ArrowUpRight } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <Card className="space-y-3">
      <CardDescription>{label}</CardDescription>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <CardTitle className="min-w-0 break-words text-2xl sm:text-3xl">{value}</CardTitle>
        <div className="flex min-w-0 items-center gap-1 text-sm text-[var(--success)]">
          <ArrowUpRight className="h-4 w-4" />
          <span className="break-words">{trend}</span>
        </div>
      </div>
    </Card>
  );
}

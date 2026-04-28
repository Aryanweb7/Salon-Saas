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
      <div className="flex items-end justify-between gap-3">
        <CardTitle className="text-3xl">{value}</CardTitle>
        <div className="flex items-center gap-1 text-sm text-[var(--success)]">
          <ArrowUpRight className="h-4 w-4" />
          {trend}
        </div>
      </div>
    </Card>
  );
}

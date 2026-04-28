import { cn } from "@/lib/utils";

export function Badge({ className, tone = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "success" | "warning" | "danger" }) {
  const tones = {
    default: "bg-[var(--muted)] text-[var(--foreground)]",
    success: "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-[var(--success)]",
    warning: "bg-[color-mix(in_srgb,var(--accent)_24%,transparent)] text-[#8a5d00]",
    danger: "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)]",
  };

  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", tones[tone], className)} {...props} />;
}

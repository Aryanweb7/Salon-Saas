import { cn } from "@/lib/utils";

export function Spinner({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizes = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]",
        sizes[size],
        className
      )}
    />
  );
}

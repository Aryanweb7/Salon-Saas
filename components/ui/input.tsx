import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-11 w-full rounded-2xl border bg-transparent px-4 outline-none focus:ring-2 focus:ring-[var(--ring)]", className)} {...props} />;
}

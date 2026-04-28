import { cn } from "@/lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({
  className,
  onCheckedChange,
  onChange,
  ...props
}: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onCheckedChange?.(checked);
    onChange?.(e);
  };

  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-[var(--muted-foreground)] checked:bg-[var(--primary)] checked:border-[var(--primary)]",
        className
      )}
      onChange={handleChange}
      {...props}
    />
  );
}

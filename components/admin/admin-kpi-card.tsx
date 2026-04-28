"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminKPICardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  icon?: React.ReactNode;
}

export function AdminKPICard({
  label,
  value,
  trend,
  className,
  icon,
}: AdminKPICardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-6 transition-all duration-300 hover:border-gray-600 hover:from-gray-900/80 hover:to-gray-800/50",
        className
      )}
    >
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          {icon && <div className="text-gray-600">{icon}</div>}
        </div>

        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            {value}
          </p>

          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-semibold",
                trend.isPositive
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              )}
            >
              {trend.isPositive ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

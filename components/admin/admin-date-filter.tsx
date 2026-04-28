"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type DateRange = "today" | "7d" | "30d" | "90d";

interface AdminDateFilterProps {
  onSelect?: (range: DateRange) => void;
  defaultRange?: DateRange;
}

const ranges: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

export function AdminDateFilter({
  onSelect,
  defaultRange = "30d",
}: AdminDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<DateRange>(defaultRange);

  const handleSelect = (range: DateRange) => {
    setSelected(range);
    setIsOpen(false);
    onSelect?.(range);
  };

  const selectedLabel =
    ranges.find((r) => r.value === selected)?.label || "Last 30 Days";

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800/50"
      >
        {selectedLabel}
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-700 bg-gray-900 shadow-xl z-50">
          {ranges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleSelect(range.value)}
              className={`block w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                selected === range.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

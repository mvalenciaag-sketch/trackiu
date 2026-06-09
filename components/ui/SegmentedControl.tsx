"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn("flex bg-surface-2 rounded-xl p-1 gap-0.5", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "relative flex-1 h-9 rounded-lg text-sm font-medium transition-colors",
            value === option.value ? "text-on-accent" : "text-muted"
          )}
        >
          {value === option.value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-accent rounded-lg shadow-sm"
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
            />
          )}
          <span className="relative z-10">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

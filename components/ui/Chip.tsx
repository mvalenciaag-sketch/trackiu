"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  color?: string;
  size?: "sm" | "md";
  className?: string;
}

export function Chip({
  label,
  selected,
  onClick,
  onRemove,
  color,
  size = "md",
  className,
}: ChipProps) {
  const isClickable = !!onClick;

  const baseClass = cn(
    "inline-flex items-center gap-1 rounded-full font-medium transition-colors select-none",
    size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
    selected
      ? "bg-accent text-white"
      : isClickable
      ? "bg-surface-2 text-muted border border-border"
      : "bg-surface-2 text-muted",
    className
  );

  const style =
    color && !selected
      ? { backgroundColor: `${color}1a`, color, borderColor: `${color}40` }
      : color && selected
      ? { backgroundColor: color, borderColor: "transparent" }
      : undefined;

  if (!isClickable) {
    return (
      <span className={baseClass} style={style}>
        {label}
        {onRemove && (
          <button
            onClick={onRemove}
            className="ml-0.5 rounded-full hover:bg-white/20 p-0.5"
            type="button"
          >
            <X size={10} />
          </button>
        )}
      </span>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className={cn(baseClass, "min-h-[44px] cursor-pointer")}
      style={style}
      type="button"
    >
      {label}
      {onRemove && (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full hover:bg-white/20 p-0.5"
        >
          <X size={10} />
        </span>
      )}
    </motion.button>
  );
}

"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-accent text-on-accent active:bg-accent-strong disabled:opacity-50",
      secondary:
        "bg-surface-2 text-foreground border border-border active:bg-zinc-600 disabled:opacity-50",
      ghost:
        "text-foreground active:bg-surface-2 disabled:opacity-50",
      danger:
        "bg-red-500/15 text-red-400 border border-red-500/20 active:bg-red-500/25 disabled:opacity-50",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm gap-1.5",
      md: "h-11 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-xl transition-colors",
          "active:scale-[0.97] touch-manipulation select-none",
          "min-w-[44px] min-h-[44px]",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };

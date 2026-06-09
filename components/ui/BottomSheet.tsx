"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Sticky footer rendered outside the scroll area (always visible) */
  footer?: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
}: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop spans full screen */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet constrained to mobile container */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className={cn(
              "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50",
              "bg-surface-2 rounded-t-2xl",
              "max-h-[92dvh] flex flex-col",
              "shadow-2xl",
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Drag handle */}
            <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <h2 className="text-base font-semibold">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface text-muted"
                  aria-label="Cerrar"
                  type="button"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Content */}
            <div
              ref={contentRef}
              className="overflow-y-auto flex-1 overscroll-contain"
            >
              {children}
            </div>

            {/* Optional sticky footer (outside scroll, always visible) */}
            {footer && (
              <div className="shrink-0 border-t border-border/50 px-4 py-3">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

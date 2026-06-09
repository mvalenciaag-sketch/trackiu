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
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(8,6,4,.45)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet — matches design's .sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className={cn(
              "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50",
              "bg-surface max-h-[88dvh] flex flex-col overflow-y-auto",
              className
            )}
            style={{
              borderRadius: "26px 26px 0 0",
              boxShadow: "0 -10px 40px -10px rgba(0,0,0,.4)",
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* Grip */}
            <div className="flex items-center justify-center pt-2 pb-3 shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-[18px] shrink-0">
                <h2 className="font-display text-[21px] font-semibold text-foreground">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-[34px] h-[34px] flex items-center justify-center rounded-xl bg-surface-3 text-foreground-2 touch-manipulation"
                  aria-label="Cerrar"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Content */}
            <div ref={contentRef} className="flex-1 overscroll-contain">
              {children}
            </div>

            {/* Sticky footer */}
            {footer && (
              <div
                className="shrink-0 px-5 pt-2 pb-6 sticky bottom-0"
                style={{
                  background: "linear-gradient(transparent, var(--surface) 22%)",
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

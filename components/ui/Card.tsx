import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: boolean;
}

export function Card({ children, className, padding = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-2xl border border-border overflow-hidden",
        padding && "p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

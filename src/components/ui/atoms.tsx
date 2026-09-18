import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={twMerge(clsx("text-xs font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground", className))}
      {...props}
    />
  )
);
Label.displayName = "Label";

export function Badge({ 
  className, 
  variant = "default", 
  children 
}: { 
  className?: string; 
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  children: React.ReactNode;
}) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-transparent",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    outline: "text-foreground border-border",
    success: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  };

  return (
    <span className={twMerge(clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors", variants[variant], className))}>
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={twMerge(clsx("rounded-xl border border-border bg-card text-card-foreground shadow-xs", className))}>
      {children}
    </div>
  );
}

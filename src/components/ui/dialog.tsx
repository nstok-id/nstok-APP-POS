"use client";

import * as React from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />
      {/* Dialog container */}
      <div className="relative z-50 w-full max-w-lg my-auto animate-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({
  className,
  children,
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className={twMerge(
        clsx(
          "relative w-full rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl text-card-foreground max-h-[88vh] overflow-y-auto",
          className
        )
      )}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full p-1 bg-muted text-muted-foreground opacity-70 transition-opacity hover:opacity-100 hover:text-foreground focus:outline-none cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={twMerge(clsx("flex flex-col space-y-1.5 text-left mb-4", className))}>{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={twMerge(clsx("text-lg font-bold leading-none tracking-tight text-foreground", className))}>{children}</h3>;
}

export function DialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={twMerge(clsx("text-xs text-muted-foreground", className))}>{children}</p>;
}

export function DialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={twMerge(clsx("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className))}>{children}</div>;
}

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={twMerge(
        clsx(
          "h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 accent-primary cursor-pointer",
          className
        )
      )}
    />
  );
}

export function NativeSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={twMerge(
        clsx(
          "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )
      )}
      {...props}
    >
      {children}
    </select>
  );
}

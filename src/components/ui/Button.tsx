"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-base rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 active:scale-[0.97]",
    secondary: "bg-primary-light text-primary hover:bg-primary-light/80",
    ghost: "bg-transparent text-text-secondary hover:bg-gray-100",
    success: "bg-success text-white hover:bg-success/90",
  };
  const sizes = {
    sm: "text-xs px-4 py-1.5",
    md: "text-sm px-6 py-2.5",
    lg: "text-md px-8 py-3",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], loading && "opacity-60 cursor-wait", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

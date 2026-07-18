"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "pillar" | "highlight";
  className?: string;
  onClick?: () => void;
}

export function Card({ children, variant = "default", className, onClick }: CardProps) {
  const base = "rounded-lg bg-card card-shadow transition-all duration-200";
  const variants = {
    default: "",
    pillar: "hover:card-shadow-hover cursor-pointer",
    highlight: "ring-2 ring-primary/20",
  };

  return (
    <div className={cn(base, variants[variant], className)} onClick={onClick}>
      {children}
    </div>
  );
}

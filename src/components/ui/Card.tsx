"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "pillar" | "highlight" | "glass";
  className?: string;
  onClick?: () => void;
}

export function Card({ children, variant = "default", className, onClick }: CardProps) {
  const base = "rounded-lg transition-all duration-200";
  const variants = {
    default: "bg-card card-shadow",
    pillar: "bg-card card-shadow hover:card-shadow-hover cursor-pointer",
    highlight: "bg-card card-shadow ring-2 ring-primary/20",
    glass: "bg-white/5 backdrop-blur-xl border border-white/[0.06] hover:bg-white/[0.08]",
  };

  return (
    <div className={cn(base, variants[variant], className)} onClick={onClick}>
      {children}
    </div>
  );
}

import { twMerge } from "tailwind-merge";

// Tailwind class merge utility — handles conflicting classes (e.g., relative + fixed)
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return twMerge(classes.filter(Boolean).join(" "));
}

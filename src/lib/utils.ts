import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn merges arbitrary Tailwind + conditional class names while deduping conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formatMonth returns a human-readable month string for UI labels.
 */
export function formatMonth(month: number) {
  return new Date(2024, month - 1, 1).toLocaleString("default", {
    month: "long",
  });
}

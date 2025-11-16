import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMonth(month: number) {
  return new Date(2024, month - 1, 1).toLocaleString("default", {
    month: "long",
  });
}

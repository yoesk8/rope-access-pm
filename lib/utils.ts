import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Converts a snake_case job category slug into a human-readable title. */
export function formatJobCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns today's date as an ISO 8601 date string (YYYY-MM-DD). */
export function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}










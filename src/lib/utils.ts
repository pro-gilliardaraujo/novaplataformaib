import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null) {
  if (!dateString) return "-"
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
} 
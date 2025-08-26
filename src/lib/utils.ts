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

/**
 * Arredonda um número seguindo a regra:
 * - Valores até 0,49 arredondam para baixo
 * - Valores a partir de 0,5 arredondam para cima
 */
export function arredondarViagens(valor: number): number {
  const parteInteira = Math.floor(valor);
  const parteFracionaria = valor - parteInteira;
  
  if (parteFracionaria < 0.5) {
    return parteInteira;
  } else {
    return parteInteira + 1;
  }
}
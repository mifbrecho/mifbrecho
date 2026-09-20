import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata centavos para R$ */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/** Converte reais (string ou number) para centavos */
export function toCents(value: number | string): number {
  const num = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
  return Math.round(num * 100);
}

import { Bill, Payment, UtilityUsage } from "./models.js";

const BILLS_KEY = "homeledger_bills";
const PAYMENTS_KEY = "homeledger_payments";
const USAGE_KEY = "homeledger_utility_usage";
const THEME_KEY = "homeledger_theme";

export function loadBills(): Bill[] {
  const raw = localStorage.getItem(BILLS_KEY);
  return raw ? (JSON.parse(raw) as Bill[]) : [];
}
export function saveBills(bills: Bill[]): void {
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

export function loadPayments(): Payment[] {
  const raw = localStorage.getItem(PAYMENTS_KEY);
  return raw ? (JSON.parse(raw) as Payment[]) : [];
}
export function savePayments(payments: Payment[]): void {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export function loadUsage(): UtilityUsage[] {
  const raw = localStorage.getItem(USAGE_KEY);
  return raw ? (JSON.parse(raw) as UtilityUsage[]) : [];
}
export function saveUsage(usages: UtilityUsage[]): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usages));
}

export function loadTheme(): "light" | "dark" {
  const raw = localStorage.getItem(THEME_KEY);
  return raw === "dark" ? "dark" : "light";
}
export function saveTheme(theme: "light" | "dark"): void {
  localStorage.setItem(THEME_KEY, theme);
}
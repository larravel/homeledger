const BILLS_KEY = "homeledger_bills";
const PAYMENTS_KEY = "homeledger_payments";
const USAGE_KEY = "homeledger_utility_usage";
const THEME_KEY = "homeledger_theme";
export function loadBills() {
    const raw = localStorage.getItem(BILLS_KEY);
    return raw ? JSON.parse(raw) : [];
}
export function saveBills(bills) {
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}
export function loadPayments() {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
}
export function savePayments(payments) {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}
export function loadUsage() {
    const raw = localStorage.getItem(USAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}
export function saveUsage(usages) {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usages));
}
export function loadTheme() {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === "dark" ? "dark" : "light";
}
export function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}

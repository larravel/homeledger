export interface AppPreferences {
  currency: 'PHP' | 'USD' | 'EUR';
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  decimalPlaces: 0 | 2;
  emailNotifications: boolean;
  billReminders: boolean;
  expenseAlerts: boolean;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  currency: 'PHP',
  notifications: true,
  theme: 'light',
  dateFormat: 'MM/DD/YYYY',
  decimalPlaces: 2,
  emailNotifications: true,
  billReminders: true,
  expenseAlerts: false,
};

export const PREFERENCES_STORAGE_KEY = 'preferences';
export const PREFERENCES_EVENT = 'homeledger:preferences-updated';
export const EXCHANGE_RATE_SOURCE_DATE = '2026-04-24';
export const BASE_CURRENCY = 'PHP';

export const EXCHANGE_RATES_FROM_PHP: Record<AppPreferences['currency'], number> = {
  PHP: 1,
  USD: 1.1712 / 71.039,
  EUR: 1 / 71.039,
};

export function getStoredPreferences(): AppPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  const saved = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!saved) {
    return DEFAULT_PREFERENCES;
  }

  try {
    return {
      ...DEFAULT_PREFERENCES,
      ...JSON.parse(saved),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveStoredPreferences(preferences: AppPreferences) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
  window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT));
}

export function publishPreferencesUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT));
}

export function applyThemePreference(theme: AppPreferences['theme']) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const resolvedTheme =
    theme === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  document.documentElement.dataset.theme = resolvedTheme;
  document.body.dataset.theme = resolvedTheme;
}

export function formatDateByPreference(
  value: string | Date | null | undefined,
  fallback = '-',
) {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const preferences = getStoredPreferences();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  switch (preferences.dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${month}/${day}/${year}`;
  }
}

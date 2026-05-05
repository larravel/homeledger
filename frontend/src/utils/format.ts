import {
  EXCHANGE_RATES_FROM_PHP,
  getStoredPreferences,
  type AppPreferences,
} from './preferences';

const CURRENCY_LOCALES: Record<AppPreferences['currency'], string> = {
  PHP: 'en-PH',
  USD: 'en-US',
  EUR: 'en-IE',
};

export function convertFromPhpBase(amount: number, currency: AppPreferences['currency']) {
  const safeAmount = Number(amount) || 0;
  return safeAmount * EXCHANGE_RATES_FROM_PHP[currency];
}

export function formatCurrency(amount: number) {
  const preferences = getStoredPreferences();
  const convertedAmount = convertFromPhpBase(amount, preferences.currency);

  return new Intl.NumberFormat(CURRENCY_LOCALES[preferences.currency], {
    style: 'currency',
    currency: preferences.currency,
    minimumFractionDigits: preferences.decimalPlaces,
    maximumFractionDigits: preferences.decimalPlaces,
  }).format(convertedAmount);
}

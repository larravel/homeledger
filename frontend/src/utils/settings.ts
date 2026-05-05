import api from '../services/api';
import {
  DEFAULT_PREFERENCES,
  getStoredPreferences,
  saveStoredPreferences,
  type AppPreferences,
} from './preferences';

export interface Budget {
  category: string;
  limit: number;
}

export interface UserSettings {
  preferences: AppPreferences;
  budgets: Budget[];
}

const BUDGETS_STORAGE_KEY = 'budgets';

function normalizeBudget(budget: Budget): Budget {
  const category = (budget.category || '').toLowerCase().trim();

  return {
    category: category === 'utility' ? 'utilities' : category,
    limit: Number(budget.limit || 0),
  };
}

function normalizePreferences(value: Partial<AppPreferences> | null | undefined) {
  return {
    ...DEFAULT_PREFERENCES,
    ...(value || {}),
  };
}

export function getCachedBudgets(): Budget[] {
  if (typeof window === 'undefined') return [];

  const saved = window.localStorage.getItem(BUDGETS_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeBudget) : [];
  } catch {
    return [];
  }
}

export function cacheBudgets(budgets: Budget[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(
    BUDGETS_STORAGE_KEY,
    JSON.stringify(budgets.map(normalizeBudget)),
  );
  window.dispatchEvent(new CustomEvent('homeledger:budgets-updated'));
}

export async function fetchUserSettings(): Promise<UserSettings> {
  const response = await api.get('/users/settings');
  const cachedBudgets = getCachedBudgets();
  const hasSavedPreferences = Boolean(response.data?.preferences);
  const hasSavedBudgets =
    Array.isArray(response.data?.budgets) && response.data.budgets.length > 0;
  const preferences = hasSavedPreferences
    ? normalizePreferences(response.data.preferences)
    : getStoredPreferences();
  const budgets = hasSavedBudgets
    ? response.data.budgets.map(normalizeBudget)
    : cachedBudgets;

  saveStoredPreferences(preferences);
  cacheBudgets(budgets);

  if (!hasSavedPreferences || (!hasSavedBudgets && cachedBudgets.length > 0)) {
    await api.patch('/users/settings', {
      preferences,
      budgets,
    });
  }

  return { preferences, budgets };
}

export async function saveUserPreferences(preferences: AppPreferences) {
  const response = await api.patch('/users/settings', { preferences });
  const nextPreferences = normalizePreferences(response.data?.preferences);
  saveStoredPreferences(nextPreferences);

  return nextPreferences;
}

export async function saveUserBudgets(budgets: Budget[]) {
  const normalizedBudgets = budgets.map(normalizeBudget);
  const response = await api.patch('/users/settings', {
    budgets: normalizedBudgets,
  });
  const nextBudgets = Array.isArray(response.data?.budgets)
    ? response.data.budgets.map(normalizeBudget)
    : normalizedBudgets;

  cacheBudgets(nextBudgets);

  return nextBudgets;
}

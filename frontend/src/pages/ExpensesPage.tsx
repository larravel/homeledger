import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Coins,
  PencilLine,
  Receipt,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  WalletCards,
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import '../styles/expenses-page.css';
import { formatCurrency } from '../utils/format';
import { SmartItemAvatar } from '../utils/itemVisual';
import { formatDateByPreference } from '../utils/preferences';

interface Expense {
  id: number;
  category: string;
  date: string;
  amount: number;
  description: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Groceries',
  transportation: 'Transportation',
  entertainment: 'Entertainment',
  healthcare: 'Healthcare',
  education: 'Education',
  dining: 'Dining Out',
  shopping: 'Shopping',
  other: 'Other',
};

const EXPENSE_CATEGORIES = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'dining', label: 'Dining Out' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
];

const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  rent: 'Rent / Mortgage',
  utilities: 'Utilities',
  insurance: 'Insurance',
};

const getCategoryLabel = (category: string) =>
  CATEGORY_LABELS[category] || LEGACY_CATEGORY_LABELS[category] || category;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [form, setForm] = useState({
    category: '',
    date: '',
    amount: '',
    description: '',
  });

  async function fetchData() {
    setLoading(true);
    try {
      const response = await api.get('/expenses');
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setExpenses(data);
    } catch (error) {
      console.error('Fetch expenses error:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      category: '',
      date: '',
      amount: '',
      description: '',
    });
  }

  function handleEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      category: expense.category,
      date: expense.date?.slice(0, 10) || '',
      amount: `${Number(expense.amount) || ''}`,
      description: expense.description || '',
    });
  }

  const isValid = form.category && form.date && Number(form.amount) > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    try {
      const payload = {
        category: form.category,
        date: form.date,
        amount: Number(form.amount),
        description: form.description || '',
      };

      if (editingId) {
        await api.patch(`/expenses/${editingId}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Save expense error:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    setDeletingId(id);
    try {
      await api.delete(`/expenses/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await fetchData();
    } catch (error) {
      console.error('Delete expense error:', error);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (filterCategory && expense.category !== filterCategory) {
        return false;
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        return true;
      }

      const haystack = `${expense.description || ''} ${expense.category}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [expenses, filterCategory, searchQuery]);

  const totalExpenses = useMemo(
    () =>
      filteredExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0,
      ),
    [filteredExpenses],
  );

  const averageExpense =
    filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();

    filteredExpenses.forEach((expense) => {
      totals.set(
        expense.category,
        (totals.get(expense.category) || 0) + Number(expense.amount || 0),
      );
    });

    return [...totals.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        label: getCategoryLabel(category),
      }))
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5);
  }, [filteredExpenses]);

  const filterCategories = useMemo(() => {
    const categories = new Set<string>(EXPENSE_CATEGORIES.map((item) => item.value));
    expenses.forEach((expense) => categories.add(expense.category));

    return [...categories].map((value) => ({
      value,
      label: getCategoryLabel(value),
    }));
  }, [expenses]);

  const recentExpenses = useMemo(
    () =>
      [...filteredExpenses]
        .sort(
          (left, right) =>
            new Date(right.date).getTime() - new Date(left.date).getTime(),
        )
        .slice(0, 4),
    [filteredExpenses],
  );

  function formatDate(dateString: string) {
    return formatDateByPreference(dateString);
  }

  return (
    <AppLayout>
      <div className="dashboard-screen">
        <div className="dashboard-screen-header">
          <div>
            <h1>Expenses</h1>
            <p>Track daily spending, monitor category trends, and keep your cash flow organized.</p>
          </div>
        </div>

        <div className="dashboard-card-grid">
          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <WalletCards size={18} />
              </div>
              <div className="dashboard-stat-title">Total Expenses</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(totalExpenses)}</div>
          </div>

          <div className="dashboard-stat-box green">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <Receipt size={18} />
              </div>
              <div className="dashboard-stat-title">Entries</div>
            </div>
            <div className="dashboard-stat-value">{filteredExpenses.length}</div>
          </div>

          <div className="dashboard-stat-box gold">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <Coins size={18} />
              </div>
              <div className="dashboard-stat-title">Average Expense</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(averageExpense)}</div>
          </div>

          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <ShoppingBag size={18} />
              </div>
              <div className="dashboard-stat-title">Top Category</div>
            </div>
            <div className="dashboard-stat-value">
              {categoryBreakdown[0]?.label || 'No data'}
            </div>
          </div>
        </div>

        <div className="bills-workspace-grid">
          <section className="dashboard-panel">
            <div className="dashboard-panel-headline">
              <div>
                <h2>{editingId ? 'Edit Expense' : 'Add New Expense'}</h2>
                <p className="bills-panel-copy">
                  Log spending quickly so your reports and category totals stay accurate.
                </p>
              </div>
            </div>

            <form className="bills-form-grid" onSubmit={handleSubmit}>
              <label className="bills-field">
                <span>Category</span>
                <select
                  className="input"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bills-field">
                <span>Date</span>
                <input
                  className="input"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="bills-field">
                <span>Amount</span>
                <input
                  className="input"
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </label>

              <label className="bills-field bills-field-wide">
                <span>Description</span>
                <input
                  className="input"
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Optional details"
                />
              </label>

              <div className="bills-form-actions">
                {editingId ? (
                  <button className="secondary-btn" type="button" onClick={resetForm}>
                    Cancel
                  </button>
                ) : null}
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={!isValid || submitting}
                >
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Save Expense'}
                </button>
              </div>
            </form>
          </section>

          <section className="dashboard-panel expenses-side-panel">
            <div className="dashboard-panel-headline">
              <div>
                <h2>Spending Snapshot</h2>
                <p className="bills-panel-copy">
                  A quick read on where your expense activity is concentrated.
                </p>
              </div>
            </div>

            <div className="expenses-side-stack">
              <div className="expenses-summary-board">
                <div className="expenses-summary-card">
                  <span>Current view total</span>
                  <strong>{formatCurrency(totalExpenses)}</strong>
                </div>
                <div className="expenses-summary-card">
                  <span>Top category</span>
                  <strong>{categoryBreakdown[0]?.label || 'No expenses yet'}</strong>
                </div>
              </div>

              <div className="bills-upcoming-block">
                <div className="bills-upcoming-head">
                  <h3>Recent Entries</h3>
                  <small>{recentExpenses.length} shown</small>
                </div>

                {recentExpenses.length === 0 ? (
                  <div className="dashboard-empty-state compact">
                    No recent expenses yet.
                  </div>
                ) : (
                  <div className="bills-upcoming-list">
                    {recentExpenses.map((expense) => (
                      <div key={expense.id} className="bills-upcoming-item">
                        <SmartItemAvatar
                          category={expense.category}
                          description={expense.description}
                        />
                        <div className="bills-upcoming-main">
                          <strong>{getCategoryLabel(expense.category)}</strong>
                          <small>{formatDate(expense.date)}</small>
                        </div>
                        <div className="bills-upcoming-side">
                          <strong>{formatCurrency(Number(expense.amount || 0))}</strong>
                          <span className="bills-status-dot paid">
                            {expense.description || 'Recorded expense'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="dashboard-panel">
          <div className="dashboard-panel-headline">
            <div>
              <h2>Expense by Category</h2>
              <p className="bills-panel-copy">
                Review which categories are taking the biggest share of your spending.
              </p>
            </div>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="dashboard-empty-state compact">
              No expense data available yet.
            </div>
          ) : (
            <div className="expenses-category-grid">
              {categoryBreakdown.map((item) => {
                const total = categoryBreakdown.reduce((sum, row) => sum + row.amount, 0);
                const share = total > 0 ? (item.amount / total) * 100 : 0;

                return (
                  <div key={item.category} className="expenses-category-card">
                    <div className="expenses-category-head">
                      <div className="expenses-category-icon">
                        <SmartItemAvatar category={item.category} description={item.label} />
                      </div>
                      <div>
                        <div className="expenses-category-label">{item.label}</div>
                        <div className="expenses-category-value">{formatCurrency(item.amount)}</div>
                      </div>
                    </div>
                    <div className="expenses-category-track">
                      <span
                        className="expenses-category-fill"
                        style={{ width: `${Math.min(share, 100)}%` }}
                      />
                    </div>
                    <div className="expenses-category-share">
                      {share.toFixed(0)}% of total expenses
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-headline">
            <div>
              <h2>Expense History</h2>
              <p className="bills-panel-copy">
                Showing {filteredExpenses.length} expense{filteredExpenses.length === 1 ? '' : 's'} in the current view.
              </p>
            </div>
            <div className="expenses-list-meta">
              <Sparkles size={16} />
              Spending activity log
            </div>
          </div>

          <div className="bills-toolbar expenses-toolbar">
            <label className="bills-filter">
              <span>Search</span>
              <div className="expenses-search-wrap">
                <Search size={16} />
                <input
                  className="input"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Description or category"
                />
              </div>
            </label>

            <label className="bills-filter">
              <span>Category</span>
              <select
                className="input"
                value={filterCategory}
                onChange={(event) => setFilterCategory(event.target.value)}
              >
                <option value="">All categories</option>
                {filterCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="secondary-btn bills-reset-btn"
              onClick={() => {
                setFilterCategory('');
                setSearchQuery('');
              }}
            >
              Reset
            </button>
          </div>

          {loading ? (
            <div className="dashboard-empty-state">Loading expenses...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="dashboard-empty-state">
              {filterCategory || searchQuery
                ? 'No expenses found for the current filters.'
                : 'No expenses recorded yet. Add your first expense to get started.'}
            </div>
          ) : (
            <div className="table-wrap bills-table-wrap">
              <table className="table bills-table expenses-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <div className="bills-table-primary expenses-table-primary">
                          <SmartItemAvatar
                            category={expense.category}
                            description={expense.description}
                          />
                          <div>
                            <strong>{getCategoryLabel(expense.category)}</strong>
                            <small>Expense entry</small>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(expense.date)}</td>
                      <td className="bills-amount-cell">
                        {formatCurrency(Number(expense.amount || 0))}
                      </td>
                      <td>{expense.description || '-'}</td>
                      <td>
                        <div className="bills-action-row">
                          <button
                            type="button"
                            className="bills-icon-btn edit"
                            onClick={() => handleEdit(expense)}
                            aria-label={`Edit expense ${expense.id}`}
                          >
                            <PencilLine size={15} />
                          </button>
                          <button
                            type="button"
                            className="bills-icon-btn delete"
                            onClick={() => handleDelete(expense.id)}
                            disabled={deletingId === expense.id}
                            aria-label={`Delete expense ${expense.id}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

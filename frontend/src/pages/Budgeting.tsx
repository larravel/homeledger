import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  HandCoins,
  PencilLine,
  PiggyBank,
  Receipt,
  Search,
  Sparkles,
  Trash2,
  WalletCards,
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import '../styles/budgeting-page.css';
import { formatCurrency } from '../utils/format';
import { SmartItemAvatar } from '../utils/itemVisual';

interface Expense {
  id: number;
  category: string;
  date: string;
  amount: number;
  description: string;
}

interface Bill {
  id: number;
  category: string;
  amount: number;
  dueDate: string;
  description: string;
  status: string;
}

interface Budget {
  category: string;
  limit: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Groceries',
  rent: 'Rent / Mortgage',
  utility: 'Utilities',
  utilities: 'Utilities',
  subscription: 'Subscriptions',
  loan: 'Loans',
  transportation: 'Transportation',
  entertainment: 'Entertainment',
  healthcare: 'Healthcare',
  insurance: 'Insurance',
  education: 'Education',
  dining: 'Dining Out',
  shopping: 'Shopping',
  other: 'Other',
};

const CATEGORIES = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'rent', label: 'Rent / Mortgage' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'loan', label: 'Loans' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'education', label: 'Education' },
  { value: 'dining', label: 'Dining Out' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
];

const BILL_CATEGORIES = new Set([
  'rent',
  'utilities',
  'subscription',
  'loan',
  'insurance',
]);

function normalizeBudgetCategory(category: string) {
  const value = (category || '').toLowerCase().trim();

  if (value === 'utility') return 'utilities';
  if (value === 'rent/mortgage') return 'rent';
  return value;
}

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function BudgetingPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState({ category: '', limit: '' });

  async function fetchData() {
    setLoading(true);
    try {
      const [expensesResponse, billsResponse] = await Promise.all([
        api.get('/expenses'),
        api.get('/bills'),
      ]);

      const expensesData = Array.isArray(expensesResponse.data)
        ? expensesResponse.data
        : expensesResponse.data?.data || [];
      const billsData = Array.isArray(billsResponse.data)
        ? billsResponse.data
        : billsResponse.data?.data || [];

      setExpenses(expensesData);
      setBills(billsData);
      loadBudgets();
    } catch (error) {
      console.error('Fetch budgeting data error:', error);
      setExpenses([]);
      setBills([]);
      loadBudgets();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function loadBudgets() {
    const saved = localStorage.getItem('budgets');
    if (!saved) {
      setBudgets([]);
      return;
    }

    const parsed = JSON.parse(saved) as Budget[];
    setBudgets(
      parsed.map((budget) => ({
        ...budget,
        category: normalizeBudgetCategory(budget.category),
      })),
    );
  }

  function saveBudgets(nextBudgets: Budget[]) {
    const normalizedBudgets = nextBudgets.map((budget) => ({
      ...budget,
      category: normalizeBudgetCategory(budget.category),
    }));
    setBudgets(normalizedBudgets);
    localStorage.setItem('budgets', JSON.stringify(normalizedBudgets));
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  const isValid = form.category && Number(form.limit) > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    const normalizedCategory = normalizeBudgetCategory(form.category);

    const nextBudgets = budgets.some((budget) => budget.category === normalizedCategory)
      ? budgets.map((budget) =>
          budget.category === normalizedCategory
            ? { ...budget, limit: Number(form.limit) }
            : budget,
        )
      : [...budgets, { category: normalizedCategory, limit: Number(form.limit) }];

    saveBudgets(nextBudgets);
    setForm({ category: '', limit: '' });
    setEditingCategory(null);
    setSubmitting(false);
  }

  function handleEditBudget(category: string) {
    const budget = budgets.find((item) => item.category === category);
    if (!budget) return;

    setEditingCategory(category);
    setForm({ category, limit: budget.limit.toString() });
  }

  function handleDeleteBudget(category: string) {
    const budget = budgets.find((item) => item.category === category);
    const label = budget ? CATEGORY_LABELS[budget.category] || budget.category : category;

    if (!window.confirm(`Are you sure you want to delete the ${label} budget?`)) {
      return;
    }

    const nextBudgets = budgets.filter((budget) => budget.category !== category);
    saveBudgets(nextBudgets);

    if (editingCategory === category) {
      setEditingCategory(null);
      setForm({ category: '', limit: '' });
    }
  }

  const paidBillsByCategory = useMemo(() => {
    const totals: Record<string, number> = {};

    bills.forEach((bill) => {
      if (bill.status !== 'paid' || !isCurrentMonth(bill.dueDate)) return;
      const category = normalizeBudgetCategory(bill.category);
      totals[category] = (totals[category] || 0) + Number(bill.amount || 0);
    });

    return totals;
  }, [bills]);

  const unpaidBillsByCategory = useMemo(() => {
    const totals: Record<string, number> = {};

    bills.forEach((bill) => {
      if (bill.status === 'paid' || !isCurrentMonth(bill.dueDate)) return;
      const category = normalizeBudgetCategory(bill.category);
      totals[category] = (totals[category] || 0) + Number(bill.amount || 0);
    });

    return totals;
  }, [bills]);

  const expensesByCategory = useMemo(() => {
    const totals: Record<string, number> = {};

    expenses.forEach((expense) => {
      if (!isCurrentMonth(expense.date)) return;
      const category = normalizeBudgetCategory(expense.category);
      totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
    });

    return totals;
  }, [expenses]);

  const budgetRows = useMemo(
    () =>
      budgets.map((budget) => {
        const category = normalizeBudgetCategory(budget.category);
        const usesBills = BILL_CATEGORIES.has(category);
        const spent = usesBills
          ? paidBillsByCategory[category] || 0
          : expensesByCategory[category] || 0;
        const planned = usesBills ? unpaidBillsByCategory[category] || 0 : 0;
        const available = budget.limit - spent - planned;
        const totalUsed = spent + planned;
        const usage = budget.limit > 0 ? (totalUsed / budget.limit) * 100 : 0;

        let status = 'On Track';
        if (available < 0) {
          status = 'Over Budget';
        } else if (planned > 0) {
          status = 'Upcoming Bills';
        } else if (usage >= 80) {
          status = 'Near Limit';
        }

        return {
          category,
          label: CATEGORY_LABELS[category] || category,
          limit: budget.limit,
          source: usesBills ? 'Bills' : 'Expenses',
          spent,
          planned,
          available,
          totalUsed,
          usage: Math.min(usage, 100),
          status,
        };
      }),
    [budgets, expensesByCategory, paidBillsByCategory, unpaidBillsByCategory],
  );

  const totalBudget = useMemo(
    () => budgetRows.reduce((sum, row) => sum + row.limit, 0),
    [budgetRows],
  );
  const totalSpent = useMemo(
    () => budgetRows.reduce((sum, row) => sum + row.spent, 0),
    [budgetRows],
  );
  const totalPlanned = useMemo(
    () => budgetRows.reduce((sum, row) => sum + row.planned, 0),
    [budgetRows],
  );
  const totalAvailable = totalBudget - totalSpent - totalPlanned;
  const filteredBudgetRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return budgetRows.filter((row) => {
      const matchesQuery =
        !query ||
        row.label.toLowerCase().includes(query) ||
        row.source.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query);
      const matchesSource = !filterSource || row.source === filterSource;
      const matchesStatus = !filterStatus || row.status === filterStatus;

      return matchesQuery && matchesSource && matchesStatus;
    });
  }, [budgetRows, filterSource, filterStatus, searchQuery]);

  if (loading) {
    return (
      <AppLayout>
        <div className="dashboard-screen">
          <div className="dashboard-empty-state">Loading budgeting workspace...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="dashboard-screen">
        <div className="dashboard-screen-header">
          <div>
            <h1>Budgeting</h1>
            <p>Set monthly limits and track what is still available.</p>
          </div>
        </div>

        <div className="dashboard-card-grid">
          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <WalletCards size={18} />
              </div>
              <div className="dashboard-stat-title">Total Budget</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(totalBudget)}</div>
          </div>

          <div className="dashboard-stat-box green">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <HandCoins size={18} />
              </div>
              <div className="dashboard-stat-title">Paid / Spent</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(totalSpent)}</div>
          </div>

          <div className="dashboard-stat-box gold">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <Receipt size={18} />
              </div>
              <div className="dashboard-stat-title">Unpaid Bills</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(totalPlanned)}</div>
          </div>

          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <PiggyBank size={18} />
              </div>
              <div className="dashboard-stat-title">Available</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(totalAvailable)}</div>
          </div>
        </div>

        <div className="budgeting-form-shell">
          <div className="bills-workspace-grid">
            <section className="dashboard-panel">
              <div className="dashboard-panel-headline">
                <div>
                  <h2>{editingCategory ? 'Edit Budget' : 'Add Budget'}</h2>
                  <p className="bills-panel-copy">
                    Set a monthly budget for one category.
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
                    disabled={Boolean(editingCategory)}
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="bills-field">
                  <span>Budget Limit</span>
                  <input
                    className="input"
                    type="number"
                    name="limit"
                    value={form.limit}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <div className="bills-form-actions">
                  {editingCategory && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        setEditingCategory(null);
                        setForm({ category: '', limit: '' });
                      }}
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={!isValid || submitting}
                  >
                    {submitting
                      ? 'Saving...'
                      : editingCategory
                        ? 'Update Budget'
                        : 'Save Budget'}
                  </button>
                </div>
              </form>
            </section>

            <aside className="dashboard-panel">
              <div className="dashboard-panel-headline">
                <div>
                  <h2>Budget Snapshot</h2>
                  <p className="bills-panel-copy">
                    A quick view of what is used and what is still pending.
                  </p>
                </div>
              </div>

              <div className="budgeting-side-stack">
                <div className="budgeting-summary-board">
                  <div className="budgeting-summary-card">
                    <span>Used right now</span>
                    <strong>{formatCurrency(totalSpent + totalPlanned)}</strong>
                  </div>
                  <div className="budgeting-summary-card">
                    <span>Tracked categories</span>
                    <strong>{budgetRows.length}</strong>
                  </div>
                </div>

                <div className="budgeting-side-note">
                  <h3>Budget logic</h3>
                  <p>
                    Bill-type categories follow paid and unpaid bills. Lifestyle categories follow recorded expenses only.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {filteredBudgetRows.length > 0 && (
          <section className="dashboard-panel">
            <div className="dashboard-panel-headline">
              <div>
                <h2>Budget by Category</h2>
                <p className="bills-panel-copy">
                  Review each category at a glance.
                </p>
              </div>
            </div>

            <div className="budget-category-grid">
              {filteredBudgetRows.map((row) => {
                const share = totalBudget > 0 ? (row.limit / totalBudget) * 100 : 0;

                return (
                  <div key={row.category} className="budget-category-card">
                    <div className="budget-category-head">
                      <div className="budget-category-icon">
                        <SmartItemAvatar category={row.category} description={row.label} />
                      </div>
                      <div>
                        <div className="budget-category-label">{row.label}</div>
                        <div className="budget-category-value">{formatCurrency(row.limit)}</div>
                      </div>
                    </div>
                    <div className="budget-category-track">
                      <span
                        className="budget-category-fill"
                        style={{ width: `${Math.min(share, 100)}%` }}
                      />
                    </div>
                    <div className="budget-category-share">
                      {share.toFixed(0)}% of total budget
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="dashboard-panel">
          <div className="dashboard-panel-headline">
              <div>
                <h2>Budget List</h2>
                <p className="bills-panel-copy">
                  Showing {filteredBudgetRows.length} budget{filteredBudgetRows.length === 1 ? '' : 's'} in this view.
                </p>
              </div>
            <div className="budgeting-list-meta">
              <Sparkles size={16} />
              Monthly limit tracker
            </div>
          </div>

          <div className="bills-toolbar budgeting-toolbar">
            <label className="bills-filter">
              <span>Search</span>
              <div className="budgeting-search-wrap">
                <Search size={16} />
                <input
                  className="input"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Category, source, or status"
                />
              </div>
            </label>

            <label className="bills-filter">
              <span>Source</span>
              <select
                className="input"
                value={filterSource}
                onChange={(event) => setFilterSource(event.target.value)}
              >
                <option value="">All sources</option>
                <option value="Bills">Bills</option>
                <option value="Expenses">Expenses</option>
              </select>
            </label>

            <label className="bills-filter">
              <span>Status</span>
              <select
                className="input"
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="On Track">On Track</option>
                <option value="Upcoming Bills">Upcoming Bills</option>
                <option value="Near Limit">Near Limit</option>
                <option value="Over Budget">Over Budget</option>
              </select>
            </label>

            <button
              type="button"
              className="secondary-btn bills-reset-btn"
              onClick={() => {
                setSearchQuery('');
                setFilterSource('');
                setFilterStatus('');
              }}
            >
              Reset
            </button>
          </div>

          {budgetRows.length === 0 ? (
            <div className="dashboard-empty-state">
              No budgets set yet. Start by adding your first budget above.
            </div>
          ) : filteredBudgetRows.length === 0 ? (
            <div className="dashboard-empty-state">
              No budgets found for the current filters.
            </div>
          ) : (
            <div className="table-wrap bills-table-wrap">
              <table className="table bills-table budget-list-table">
                <thead>
                  <tr>
                    <th className="budget-col-category">Category</th>
                    <th className="budget-col-source">Source</th>
                    <th className="budget-col-money">Budget</th>
                    <th className="budget-col-spent">Paid / Spent</th>
                    <th className="budget-col-money">Unpaid Bills</th>
                    <th className="budget-col-money">Available</th>
                    <th className="budget-col-status">Status</th>
                    <th className="budget-col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBudgetRows.map((row) => (
                    <tr key={row.category}>
                      <td className="budget-col-category">
                        <div className="bills-table-primary budget-table-primary">
                          <SmartItemAvatar category={row.category} />
                          <div>
                            <strong>{row.label}</strong>
                          </div>
                        </div>
                      </td>
                      <td className="budget-col-source">{row.source}</td>
                      <td className="bills-amount-cell budget-col-money">{formatCurrency(row.limit)}</td>
                      <td className="budget-spent-cell budget-col-spent">
                        <strong>{formatCurrency(row.spent)}</strong>
                      </td>
                      <td className="budget-col-money">{formatCurrency(row.planned)}</td>
                      <td
                        className="bills-amount-cell budget-col-money"
                        style={{ color: row.available >= 0 ? '#16a34a' : '#dc2626' }}
                      >
                        {formatCurrency(row.available)}
                      </td>
                      <td className="budget-status-cell budget-col-status">
                        <span
                          className={`bills-status-chip ${
                            row.status === 'Over Budget'
                              ? 'overdue'
                              : row.status === 'Near Limit' || row.status === 'Upcoming Bills'
                                ? 'dueSoon'
                                : 'paid'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="budget-col-actions">
                        <div className="bills-action-row">
                          <button
                            type="button"
                            className="bills-icon-btn edit"
                            onClick={() => handleEditBudget(row.category)}
                            aria-label={`Edit budget ${row.label}`}
                          >
                            <PencilLine size={15} />
                          </button>
                          <button
                            type="button"
                            className="bills-icon-btn delete"
                            onClick={() => handleDeleteBudget(row.category)}
                            aria-label={`Delete budget ${row.label}`}
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

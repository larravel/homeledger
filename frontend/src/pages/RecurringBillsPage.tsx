import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Clock3,
  CircleAlert,
  PencilLine,
  Repeat2,
  Sparkles,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import '../styles/recurring-bills.css';
import { formatCurrency } from '../utils/format';
import { SmartItemAvatar } from '../utils/itemVisual';
import { formatDateByPreference } from '../utils/preferences';

interface RecurringBill {
  id: number;
  name: string;
  provider: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'quarterly';
  startDate: string;
  lastGenerated: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface NoticeState {
  type: 'success' | 'error';
  message: string;
}

const CATEGORIES = [
  { value: 'utility', label: 'Utilities' },
  { value: 'rent', label: 'Rent / Mortgage' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'loan', label: 'Loans' },
  { value: 'insurance', label: 'Insurance' },
];

const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  transportation: 'Transportation',
  healthcare: 'Healthcare',
  education: 'Education',
};

const FREQUENCIES = [
  { value: 'monthly', label: 'Every month' },
  { value: 'quarterly', label: 'Every 3 months' },
];

const DAY_MS = 1000 * 60 * 60 * 24;

const getCycleMonths = (frequency: 'monthly' | 'quarterly') =>
  frequency === 'monthly' ? 1 : 3;

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

const floorDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addMonths = (dateString: string, months: number) => {
  const nextDate = parseDate(dateString);
  nextDate.setMonth(nextDate.getMonth() + months);
  return formatDateValue(nextDate);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return formatDateByPreference(dateString, 'Never');
};

const getFrequencyLabel = (frequency: 'monthly' | 'quarterly') =>
  frequency === 'monthly' ? 'Every month' : 'Every 3 months';

const getNextRunDate = (
  bill: Pick<RecurringBill, 'startDate' | 'lastGenerated' | 'frequency'>,
) =>
  bill.lastGenerated
    ? addMonths(bill.lastGenerated, getCycleMonths(bill.frequency))
    : bill.startDate;

function getDueDayCount(dateString: string) {
  const today = floorDate(new Date());
  const nextRun = floorDate(parseDate(dateString));
  return Math.round((nextRun.getTime() - today.getTime()) / DAY_MS);
}

function getScheduleStatus(
  bill: Pick<RecurringBill, 'startDate' | 'lastGenerated' | 'frequency'>,
) {
  const nextRunDate = getNextRunDate(bill);
  const diffDays = getDueDayCount(nextRunDate);

  if (diffDays < 0) {
    return {
      text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`,
      className: 'overdue',
    };
  }
  if (diffDays === 0) {
    return { text: 'Due today', className: 'dueNow' };
  }
  if (diffDays <= 7) {
    return {
      text: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
      className: 'dueSoon',
    };
  }
  return { text: 'Scheduled', className: 'scheduled' };
}

export default function RecurringBillsPage() {
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('');
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const [form, setForm] = useState({
    name: '',
    provider: '',
    amount: '',
    category: '',
    frequency: '',
    startDate: '',
  });

  function resetForm() {
    setEditingId(null);
    setForm({
      name: '',
      provider: '',
      amount: '',
      category: '',
      frequency: '',
      startDate: '',
    });
  }

  async function fetchData() {
    setLoading(true);
    try {
      const response = await api.get('/recurring-bills');
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setRecurringBills(data);
    } catch (error) {
      console.error('Fetch recurring bills error:', error);
      setRecurringBills([]);
      setNotice({
        type: 'error',
        message: 'Unable to load recurring bills right now.',
      });
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

  const isValid =
    form.name.trim() &&
    form.provider.trim() &&
    Number(form.amount) > 0 &&
    form.category &&
    form.frequency &&
    form.startDate;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setNotice(null);

    const payload = {
      name: form.name.trim(),
      provider: form.provider.trim(),
      amount: Number(form.amount),
      category: form.category,
      frequency: form.frequency,
      startDate: form.startDate,
    };

    try {
      if (editingId) {
        await api.patch(`/recurring-bills/${editingId}`, payload);
        setNotice({ type: 'success', message: 'Recurring bill updated successfully.' });
      } else {
        await api.post('/recurring-bills', payload);
        setNotice({ type: 'success', message: 'Recurring bill added successfully.' });
      }

      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Save recurring bill error:', error);
      setNotice({
        type: 'error',
        message: 'Could not save the recurring bill. Please check your inputs.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(bill: RecurringBill) {
    setEditingId(bill.id);
    setNotice(null);
    setForm({
      name: bill.name,
      provider: bill.provider,
      amount: String(bill.amount),
      category: bill.category,
      frequency: bill.frequency,
      startDate: bill.startDate,
    });
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this recurring bill and stop future bill generation?')) {
      return;
    }

    setDeletingId(id);
    setNotice(null);

    try {
      await api.delete(`/recurring-bills/${id}`);
      if (editingId === id) {
        resetForm();
      }
      setNotice({ type: 'success', message: 'Recurring bill deleted successfully.' });
      await fetchData();
    } catch (error) {
      console.error('Delete recurring bill error:', error);
      setNotice({ type: 'error', message: 'Could not delete the recurring bill.' });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleGenerateBills() {
    setGenerating(true);
    setNotice(null);

    try {
      const response = await api.post('/recurring-bills/generate');
      const message =
        typeof response.data?.message === 'string'
          ? response.data.message
          : 'Recurring bills processed successfully.';

      setNotice({ type: 'success', message });
      await fetchData();
    } catch (error) {
      console.error('Generate recurring bills error:', error);
      setNotice({
        type: 'error',
        message: 'Could not run the recurring billing cycle.',
      });
    } finally {
      setGenerating(false);
    }
  }

  const filteredBills = useMemo(() => {
    return recurringBills.filter((bill) => {
      const query = searchQuery.trim().toLowerCase();
      if (
        query &&
        !bill.name.toLowerCase().includes(query) &&
        !bill.provider.toLowerCase().includes(query)
      ) {
        return false;
      }

      if (filterCategory && bill.category !== filterCategory) {
        return false;
      }

      if (filterFrequency && bill.frequency !== filterFrequency) {
        return false;
      }

      return true;
    });
  }, [filterCategory, filterFrequency, recurringBills, searchQuery]);

  const dueThisMonth = useMemo(
    () =>
      filteredBills.filter((bill) => {
        const date = parseDate(getNextRunDate(bill));
        const today = new Date();
        return (
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      }),
    [filteredBills],
  );

  const dueNowBills = useMemo(
    () => filteredBills.filter((bill) => getDueDayCount(getNextRunDate(bill)) <= 0),
    [filteredBills],
  );

  const dueThisWeekBills = useMemo(
    () =>
      filteredBills.filter((bill) => {
        const diff = getDueDayCount(getNextRunDate(bill));
        return diff >= 0 && diff <= 7;
      }),
    [filteredBills],
  );

  const dueThisMonthTotal = useMemo(
    () => dueThisMonth.reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [dueThisMonth],
  );



  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};

    filteredBills.forEach((bill) => {
      breakdown[bill.category] = (breakdown[bill.category] || 0) + Number(bill.amount || 0);
    });

    return Object.entries(breakdown)
      .map(([category, amount]) => ({
        category,
        label:
          CATEGORIES.find((item) => item.value === category)?.label ||
          LEGACY_CATEGORY_LABELS[category] ||
          category,
        amount,
      }))
      .sort((left, right) => right.amount - left.amount);
  }, [filteredBills]);

  const filterCategories = useMemo(() => {
    const categories = new Set<string>(CATEGORIES.map((item) => item.value));
    recurringBills.forEach((bill) => categories.add(bill.category));

    return [...categories].map((value) => ({
      value,
      label: CATEGORIES.find((item) => item.value === value)?.label || LEGACY_CATEGORY_LABELS[value] || value,
    }));
  }, [recurringBills]);

  const upcomingBills = useMemo(
    () =>
      [...filteredBills]
        .sort((left, right) => getNextRunDate(left).localeCompare(getNextRunDate(right)))
        .slice(0, 4),
    [filteredBills],
  );

  const topCategoryLabel =
    categoryBreakdown[0]?.label || 'No recurring bills yet';

  return (
    <AppLayout>
      <div className="dashboard-screen">
        <div className="dashboard-screen-header recurring-header">
          <div>
            <h1>Recurring Bills</h1>
            <p>Manage repeating bills and see what is scheduled next.</p>
          </div>

          <div className="recurring-header-actions">
            <button
              type="button"
              className="primary-btn recurring-generate-btn"
              onClick={handleGenerateBills}
              disabled={generating}
            >
              <WandSparkles size={16} />
              {generating ? 'Running cycle...' : 'Generate Due Bills'}
            </button>
          </div>
        </div>

        {notice && (
          <div className={`alert ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {notice.message}
          </div>
        )}

        <div className="dashboard-card-grid">
          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <Repeat2 size={18} />
              </div>
              <div className="dashboard-stat-title">Active Recurring Bills</div>
            </div>
            <div className="dashboard-stat-value">{filteredBills.length}</div>
          </div>

          <div className="dashboard-stat-box green">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <CalendarClock size={18} />
              </div>
              <div className="dashboard-stat-title">Due This Month</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(dueThisMonthTotal)}</div>
          </div>

          <div className="dashboard-stat-box gold">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <Clock3 size={18} />
              </div>
              <div className="dashboard-stat-title">Due This Week</div>
            </div>
            <div className="dashboard-stat-value">{dueThisWeekBills.length}</div>
          </div>

          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <CircleAlert size={18} />
              </div>
              <div className="dashboard-stat-title">Needs Attention</div>
            </div>
            <div className="dashboard-stat-value">{dueNowBills.length}</div>
          </div>
        </div>

        <div className="recurring-workspace-grid">
          <section className="dashboard-panel">
            <div className="dashboard-panel-headline">
              <div>
                <h2>{editingId ? 'Edit Recurring Bill' : 'Add Recurring Bill'}</h2>
                <p className="bills-panel-copy">
                  Set the charge, start date, and repeat cycle.
                </p>
              </div>
            </div>

            <form className="bills-form-grid" onSubmit={handleSubmit}>
              <label className="bills-field">
                <span>Bill Name</span>
                <input
                  className="input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Internet service"
                  required
                />
              </label>

              <label className="bills-field">
                <span>Provider</span>
                <input
                  className="input"
                  type="text"
                  name="provider"
                  value={form.provider}
                  onChange={handleChange}
                  placeholder="Provider name"
                  required
                />
              </label>

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
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bills-field">
                <span>Repeats</span>
                <select
                  className="input"
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select repeat option</option>
                  {FREQUENCIES.map((frequency) => (
                    <option key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bills-field">
                <span>Start Date</span>
                <input
                  className="input"
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="bills-field">
                <span>Charge Amount</span>
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

              <div className="bills-form-actions">
                {editingId && (
                  <button type="button" className="secondary-btn" onClick={resetForm}>
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
                    : editingId
                      ? 'Update Recurring Bill'
                      : 'Save Recurring Bill'}
                </button>
              </div>
            </form>
          </section>

          <section className="dashboard-panel recurring-side-panel">
            <div className="dashboard-panel-headline">
              <div>
                <h2>Recurring Snapshot</h2>
                <p className="bills-panel-copy">
                  A quick view of this month’s recurring total and leading category.
                </p>
              </div>
            </div>

            <div className="recurring-snapshot-stack">
              <div className="recurring-summary-board">
                <div className="recurring-summary-card">
                  <span>Scheduled this month</span>
                  <strong>{formatCurrency(dueThisMonthTotal)}</strong>
                </div>

                <div className="recurring-summary-card">
                  <span>Leading category</span>
                  <strong>{topCategoryLabel}</strong>
                </div>
              </div>

              <div className="bills-upcoming-block">
                <div className="bills-upcoming-head">
                  <h3>Upcoming Next</h3>
                  <small>{upcomingBills.length} scheduled</small>
                </div>

                {upcomingBills.length === 0 ? (
                  <div className="dashboard-empty-state compact">
                    No upcoming recurring bills yet.
                  </div>
                ) : (
                  <div className="bills-upcoming-list">
                    {upcomingBills.map((bill) => {
                      const status = getScheduleStatus(bill);

                      return (
                        <div key={bill.id} className="bills-upcoming-item">
                          <SmartItemAvatar
                            name={bill.name}
                            provider={bill.provider}
                            category={bill.category}
                          />

                          <div className="bills-upcoming-main">
                            <strong>{bill.name}</strong>
                            <small>
                              {formatDate(getNextRunDate(bill))} • {getFrequencyLabel(bill.frequency)}
                            </small>
                          </div>

                          <div className="bills-upcoming-side">
                            <strong>{formatCurrency(Number(bill.amount || 0))}</strong>
                            <span className={`bills-status-dot ${status.className}`}>
                              {status.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="dashboard-panel">
          <div className="dashboard-panel-headline">
              <div>
                <h2>Category Distribution</h2>
                <p className="bills-panel-copy">
                  See which categories take the biggest share of recurring charges.
                </p>
              </div>
            </div>

          {categoryBreakdown.length === 0 ? (
            <div className="dashboard-empty-state compact">
              No recurring bill data yet.
            </div>
          ) : (
            <div className="recurring-mix-grid">
              {categoryBreakdown.map((item) => {
                const total = categoryBreakdown.reduce((sum, row) => sum + row.amount, 0);
                const share = total > 0 ? (item.amount / total) * 100 : 0;

                return (
                  <div key={item.category} className="recurring-mix-card">
                    <div className="recurring-mix-head">
                      <div className="recurring-mix-icon">
                        <SmartItemAvatar category={item.category} description={item.label} />
                      </div>
                      <div>
                        <div className="recurring-mix-label">{item.label}</div>
                        <div className="recurring-mix-value">{formatCurrency(item.amount)}</div>
                      </div>
                    </div>
                    <div className="recurring-mix-track">
                      <span
                        className="recurring-mix-fill"
                        style={{ width: `${Math.min(share, 100)}%` }}
                      />
                    </div>
                    <div className="recurring-mix-share">
                      {share.toFixed(0)}% of scheduled charges
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
                <h2>Recurring Bill List</h2>
                <p className="bills-panel-copy">
                  Showing {filteredBills.length} recurring bill{filteredBills.length === 1 ? '' : 's'} in this view.
                </p>
              </div>
            <div className="recurring-list-meta">
              <Sparkles size={16} />
              Recurring schedule tracker
            </div>
          </div>

          <div className="bills-toolbar">
            <label className="bills-filter">
              <span>Search</span>
              <input
                className="input"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Bill or provider"
              />
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

            <label className="bills-filter">
              <span>Repeats</span>
              <select
                className="input"
                value={filterFrequency}
                onChange={(event) => setFilterFrequency(event.target.value)}
              >
                <option value="">All repeat options</option>
                {FREQUENCIES.map((frequency) => (
                  <option key={frequency.value} value={frequency.value}>
                    {frequency.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="secondary-btn bills-reset-btn"
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('');
                setFilterFrequency('');
              }}
            >
              Reset
            </button>
          </div>

          {loading ? (
            <div className="dashboard-empty-state">Loading recurring bills...</div>
          ) : filteredBills.length === 0 ? (
            <div className="dashboard-empty-state">
              {searchQuery || filterCategory || filterFrequency
                ? 'No recurring bills match your current filters.'
                : 'Create your first recurring bill to automate future billing cycles.'}
            </div>
          ) : (
            <div className="table-wrap bills-table-wrap">
              <table className="table bills-table recurring-portfolio-table">
                <thead>
                  <tr>
                    <th>Bill</th>
                    <th>Repeats</th>
                    <th>Charge Amount</th>
                    <th>Start Date</th>
                    <th>Next Bill Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => {
                    const nextRunDate = getNextRunDate(bill);
                    const status = getScheduleStatus(bill);

                    return (
                      <tr key={bill.id}>
                        <td>
                          <div className="bills-table-primary recurring-bill-cell">
                            <SmartItemAvatar
                              name={bill.name}
                              provider={bill.provider}
                              category={bill.category}
                            />
                            <div>
                              <strong>{bill.name}</strong>
                              <small>{bill.provider}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="recurring-frequency-label">
                            {getFrequencyLabel(bill.frequency)}
                          </span>
                        </td>
                        <td className="bills-amount-cell">
                          {formatCurrency(Number(bill.amount || 0))}
                        </td>
                        <td>{formatDate(bill.startDate)}</td>
                        <td>
                          <span className="recurring-next-run">{formatDate(nextRunDate)}</span>
                        </td>
                        <td>
                          <span className={`bills-status-chip ${status.className}`}>
                            {status.text}
                          </span>
                        </td>
                        <td>
                          <div className="bills-action-row">
                            <button
                              type="button"
                              className="bills-icon-btn edit"
                              onClick={() => handleEdit(bill)}
                              aria-label={`Edit ${bill.name}`}
                            >
                              <PencilLine size={15} />
                            </button>
                            <button
                              type="button"
                              className="bills-icon-btn delete"
                              onClick={() => handleDelete(bill.id)}
                              disabled={deletingId === bill.id}
                              aria-label={`Delete ${bill.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

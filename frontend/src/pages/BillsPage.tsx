import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  HandCoins,
  PencilLine,
  Receipt,
  Trash2,
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import '../styles/bills-page.css';
import { formatCurrency } from '../utils/format';
import { SmartItemAvatar } from '../utils/itemVisual';
import { formatDateByPreference } from '../utils/preferences';

interface Bill {
  id: number;
  name: string;
  provider: string;
  amount: number;
  dueDate: string;
  status: string;
  category: string;
  isRecurring: boolean;
  frequency: string | null;
}

const BILL_CATEGORIES = [
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

type BillStatus = 'paid' | 'overdue' | 'dueSoon' | 'unpaid';

function getCategoryLabel(category: string) {
  return (
    BILL_CATEGORIES.find((item) => item.value === category)?.label ||
    LEGACY_CATEGORY_LABELS[category] ||
    category
  );
}

function getBillStatus(bill: Pick<Bill, 'status' | 'dueDate'>): BillStatus {
  if (bill.status === 'paid') return 'paid';

  const today = new Date();
  const due = new Date(`${bill.dueDate}T00:00:00`);
  const todayFloor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = (due.getTime() - todayFloor.getTime()) / (1000 * 60 * 60 * 24);

  if (due < todayFloor) return 'overdue';
  if (diff <= 7 && diff >= 0) return 'dueSoon';
  return 'unpaid';
}

function getStatusMeta(bill: Pick<Bill, 'status' | 'dueDate'>) {
  const status = getBillStatus(bill);
  switch (status) {
    case 'paid':
      return { text: 'Paid', className: 'paid' };
    case 'overdue':
      return { text: 'Overdue', className: 'overdue' };
    case 'dueSoon':
      return { text: 'Due Soon', className: 'dueSoon' };
    default:
      return { text: 'Unpaid', className: 'unpaid' };
  }
}

function formatDate(value: string) {
  return formatDateByPreference(value, '-');
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState({
    name: '',
    provider: '',
    amount: '',
    dueDate: '',
    category: '',
  });

  async function fetchData() {
    setLoading(true);
    try {
      const response = await api.get('/bills');
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setBills(data);
    } catch (error) {
      console.error('Fetch bills error:', error);
      setBills([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      name: '',
      provider: '',
      amount: '',
      dueDate: '',
      category: '',
    });
  }

  function handleEdit(bill: Bill) {
    setEditingId(bill.id);
    setForm({
      name: bill.name,
      provider: bill.provider,
      amount: `${Number(bill.amount) || ''}`,
      dueDate: bill.dueDate?.slice(0, 10) || '',
      category: bill.category,
    });
  }

  const isValid =
    form.name.trim() &&
    form.provider.trim() &&
    Number(form.amount) > 0 &&
    form.dueDate &&
    form.category;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      provider: form.provider.trim(),
      amount: Number(form.amount),
      dueDate: form.dueDate,
      category: form.category,
      isRecurring: false,
    };

    try {
      if (editingId) {
        await api.patch(`/bills/${editingId}`, payload);
      } else {
        await api.post('/bills', payload);
      }
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Save bill error:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;

    setDeletingId(id);
    try {
      await api.delete(`/bills/${id}`);
      if (editingId === id) resetForm();
      await fetchData();
    } catch (error) {
      console.error('Delete bill error:', error);
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePay(bill: Bill) {
    setPayingId(bill.id);
    try {
      await api.post(`/payments/bill/${bill.id}`, {
        paymentDate: new Date().toISOString().split('T')[0],
      });
      await fetchData();
    } catch (error) {
      console.error('Pay bill error:', error);
    } finally {
      setPayingId(null);
    }
  }

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (searchQuery) {
        const source = `${bill.name} ${bill.provider}`.toLowerCase();
        if (!source.includes(searchQuery.toLowerCase())) return false;
      }

      if (filterCategory && bill.category !== filterCategory) return false;
      if (filterStatus && getBillStatus(bill) !== filterStatus) return false;

      return true;
    });
  }, [bills, searchQuery, filterCategory, filterStatus]);

  const totalBills = filteredBills.length;
  const totalAmount = useMemo(
    () => filteredBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [filteredBills],
  );
  const dueSoonCount = useMemo(
    () => filteredBills.filter((bill) => getBillStatus(bill) === 'dueSoon').length,
    [filteredBills],
  );
  const overdueCount = useMemo(
    () => filteredBills.filter((bill) => getBillStatus(bill) === 'overdue').length,
    [filteredBills],
  );

  const upcomingBills = useMemo(
    () =>
      [...filteredBills]
        .filter((bill) => bill.status !== 'paid')
        .sort(
          (left, right) =>
            new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
        )
        .slice(0, 4),
    [filteredBills],
  );

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    filteredBills.forEach((bill) => {
      totals.set(bill.category, (totals.get(bill.category) || 0) + Number(bill.amount || 0));
    });

    return [...totals.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        label: getCategoryLabel(category),
      }))
      .sort((left, right) => right.amount - left.amount);
  }, [filteredBills]);

  const filterCategories = useMemo(() => {
    const categories = new Set<string>(BILL_CATEGORIES.map((item) => item.value));
    bills.forEach((bill) => categories.add(bill.category));

    return [...categories].map((value) => ({
      value,
      label: getCategoryLabel(value),
    }));
  }, [bills]);

  return (
    <AppLayout>
      <div className="dashboard-screen">
        <div className="dashboard-screen-header">
          <div>
            <h1>Bills</h1>
            <p>Track due dates, manage obligations, and pay bills on time.</p>
          </div>
        </div>

        <div className="dashboard-card-grid">
          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <Receipt size={18} />
              </div>
              <div className="dashboard-stat-title">Active Bills</div>
            </div>
            <div className="dashboard-stat-value">{totalBills}</div>
          </div>

          <div className="dashboard-stat-box green">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <HandCoins size={18} />
              </div>
              <div className="dashboard-stat-title">Total Bill Amount</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(totalAmount)}</div>
          </div>

          <div className="dashboard-stat-box gold">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <CalendarClock size={18} />
              </div>
              <div className="dashboard-stat-title">Due Soon</div>
            </div>
            <div className="dashboard-stat-value">{dueSoonCount}</div>
          </div>

          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <AlertTriangle size={18} />
              </div>
              <div className="dashboard-stat-title">Overdue</div>
            </div>
            <div className="dashboard-stat-value">{overdueCount}</div>
          </div>
        </div>

        <div className="bills-workspace-grid">
          <section className="dashboard-panel">
            <div className="dashboard-panel-headline">
              <div>
                <h2>{editingId ? 'Edit Bill' : 'Add New Bill'}</h2>
                <p className="bills-panel-copy">
                  Keep your bill list current so due dates, budgets, and payment history stay aligned.
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
                  placeholder="Electricity bill"
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
                  placeholder="Meralco, Manila Water, Netflix"
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
                  {BILL_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bills-field">
                <span>Due Date</span>
                <input
                  className="input"
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="bills-field bills-field-wide">
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

              <div className="bills-form-actions">
                {editingId ? (
                  <button className="secondary-btn" type="button" onClick={resetForm}>
                    Cancel
                  </button>
                ) : null}
                <button className="primary-btn" type="submit" disabled={!isValid || submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Bill'}
                </button>
              </div>
            </form>
          </section>

          <aside className="dashboard-panel">
            <div className="dashboard-panel-headline">
              <div>
                <h2>Billing Snapshot</h2>
                <p className="bills-panel-copy">
                  A quick look at your leading bill category and what is coming up next.
                </p>
              </div>
            </div>

            <div className="bills-snapshot-stack">
              <div className="bills-snapshot-card">
                <span>Largest Category</span>
                <strong>{categoryBreakdown[0]?.label || 'No data yet'}</strong>
              </div>
              <div className="bills-snapshot-card">
                <span>Largest Category Amount</span>
                <strong>{formatCurrency(categoryBreakdown[0]?.amount || 0)}</strong>
              </div>

              <div className="bills-upcoming-block">
                <div className="bills-upcoming-head">
                  <h3>Upcoming Bills</h3>
                  <small>{upcomingBills.length} showing</small>
                </div>

                <div className="bills-upcoming-list">
                  {upcomingBills.length === 0 ? (
                    <div className="dashboard-empty-state compact">
                      No upcoming bills yet.
                    </div>
                  ) : (
                    upcomingBills.map((bill) => {
                      const status = getStatusMeta(bill);
                      return (
                        <div key={bill.id} className="bills-upcoming-item">
                          <SmartItemAvatar
                            name={bill.name}
                            provider={bill.provider}
                            category={bill.category}
                          />
                          <div className="bills-upcoming-main">
                            <strong>{bill.name}</strong>
                            <small>{formatDate(bill.dueDate)}</small>
                          </div>
                          <div className="bills-upcoming-side">
                            <strong>{formatCurrency(bill.amount)}</strong>
                            <span className={`bills-status-dot ${status.className}`}>
                              {status.text}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="dashboard-panel">
          <div className="dashboard-panel-headline">
            <div>
              <h2>Bill History</h2>
              <p className="bills-panel-copy">
                Showing {filteredBills.length} bill{filteredBills.length === 1 ? '' : 's'} in the current view.
              </p>
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
                placeholder="Bill name or provider"
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
              <span>Status</span>
              <select
                className="input"
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="dueSoon">Due Soon</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>

            <button
              className="secondary-btn bills-reset-btn"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('');
                setFilterStatus('');
              }}
            >
              Reset
            </button>
          </div>

          {loading ? (
            <div className="dashboard-empty-state">Loading bills...</div>
          ) : filteredBills.length === 0 ? (
            <div className="dashboard-empty-state">
              {searchQuery || filterCategory || filterStatus
                ? 'No bills match your current filters.'
                : 'No bills recorded yet.'}
            </div>
          ) : (
            <div className="bills-table-wrap">
              <table className="table bills-table">
                <thead>
                  <tr>
                    <th>Bill</th>
                    <th>Category</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => {
                    const status = getStatusMeta(bill);

                    return (
                      <tr key={bill.id}>
                        <td>
                          <div className="bills-table-primary">
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
                        <td>{getCategoryLabel(bill.category)}</td>
                        <td>{formatDate(bill.dueDate)}</td>
                        <td className="bills-amount-cell">{formatCurrency(bill.amount)}</td>
                        <td>
                          <span className={`bills-status-chip ${status.className}`}>
                            {status.text}
                          </span>
                        </td>
                        <td>
                          <div className="bills-action-row">
                            {bill.status !== 'paid' ? (
                              <button
                                className="primary-btn"
                                type="button"
                                onClick={() => handlePay(bill)}
                                disabled={payingId === bill.id}
                              >
                                {payingId === bill.id ? 'Paying...' : 'Pay'}
                              </button>
                            ) : null}
                            <button
                              className="bills-icon-btn edit"
                              type="button"
                              onClick={() => handleEdit(bill)}
                              aria-label={`Edit ${bill.name}`}
                            >
                              <PencilLine size={16} />
                            </button>
                            <button
                              className="bills-icon-btn delete"
                              type="button"
                              onClick={() => handleDelete(bill.id)}
                              disabled={deletingId === bill.id}
                              aria-label={`Delete ${bill.name}`}
                            >
                              <Trash2 size={16} />
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

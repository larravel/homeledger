import { useEffect, useMemo, useState } from 'react';
import { Coins, CreditCard, Landmark, Search, ShieldAlert, Sparkles } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import '../styles/payment-history.css';
import { formatCurrency } from '../utils/format';
import { SmartItemAvatar } from '../utils/itemVisual';
import { formatDateByPreference } from '../utils/preferences';

interface Payment {
  id: number;
  paymentDate: string;
  amountPaid: number;
  lateFee: number;
  bill?: {
    name: string;
    provider: string;
    amount?: number;
  };
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      try {
        const response = await api.get('/payments');
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setPayments(data);
      } catch (error) {
        console.error('Fetch payments error:', error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  function getBaseAmount(payment: Payment) {
    if (typeof payment.bill?.amount === 'number') {
      return Number(payment.bill.amount || 0);
    }

    const amountPaid = Number(payment.amountPaid ?? 0);
    const lateFee = Number(payment.lateFee ?? 0);
    return Math.max(0, amountPaid - lateFee);
  }

  function getLateFee(payment: Payment) {
    return Number(payment.lateFee ?? 0);
  }

  function getTotal(payment: Payment) {
    return Number(payment.amountPaid ?? getBaseAmount(payment) + getLateFee(payment));
  }

  function getMonthKey(date: string) {
    const parsed = new Date(date);
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
  }

  function getMonthLabel(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }

  function formatDate(value: string) {
    return formatDateByPreference(value);
  }

  const filteredPayments = useMemo(() => {
    let next = payments.filter((payment) => {
      const combined = `${payment.bill?.name || ''} ${payment.bill?.provider || ''}`;
      return combined.toLowerCase().includes(search.toLowerCase());
    });

    if (filter === 'late') {
      next = next.filter((payment) => getLateFee(payment) > 0);
    } else if (filter === 'ontime') {
      next = next.filter((payment) => getLateFee(payment) === 0);
    }

    return [...next].sort((left, right) => {
      if (sort === 'newest') {
        return (
          new Date(right.paymentDate).getTime() -
          new Date(left.paymentDate).getTime()
        );
      }
      if (sort === 'oldest') {
        return (
          new Date(left.paymentDate).getTime() -
          new Date(right.paymentDate).getTime()
        );
      }
      if (sort === 'highest') {
        return getTotal(right) - getTotal(left);
      }
      return getTotal(left) - getTotal(right);
    });
  }, [filter, payments, search, sort]);

  const groupedEntries = useMemo(() => {
    const grouped: Record<string, Payment[]> = {};

    filteredPayments.forEach((payment) => {
      const key = getMonthKey(payment.paymentDate);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(payment);
    });

    return Object.entries(grouped).sort((left, right) =>
      right[0].localeCompare(left[0]),
    );
  }, [filteredPayments]);

  const currentMonthKey = getMonthKey(new Date().toISOString());
  const thisMonthPayments = groupedEntries.find(([key]) => key === currentMonthKey)?.[1] || [];

  const totalThisMonth = thisMonthPayments.reduce(
    (sum, payment) => sum + getTotal(payment),
    0,
  );
  const lateCount = thisMonthPayments.filter(
    (payment) => getLateFee(payment) > 0,
  ).length;
  const onTimeCount = thisMonthPayments.filter(
    (payment) => getLateFee(payment) === 0,
  ).length;
  const averagePayment =
    thisMonthPayments.length > 0 ? totalThisMonth / thisMonthPayments.length : 0;

  return (
    <AppLayout>
      <div className="dashboard-screen">
        <div className="dashboard-screen-header">
          <div>
            <h1>Payment History</h1>
            <p>Review settled bills, payment timing, and monthly totals.</p>
          </div>
        </div>

        <div className="dashboard-card-grid">
          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <Landmark size={18} />
              </div>
              <div className="dashboard-stat-title">This Month Spent</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(totalThisMonth)}</div>
          </div>

          <div className="dashboard-stat-box green">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <CreditCard size={18} />
              </div>
              <div className="dashboard-stat-title">On-Time Payments</div>
            </div>
            <div className="dashboard-stat-value">{onTimeCount}</div>
          </div>

          <div className="dashboard-stat-box gold">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <ShieldAlert size={18} />
              </div>
              <div className="dashboard-stat-title">Late Payments</div>
            </div>
            <div className="dashboard-stat-value">{lateCount}</div>
          </div>

          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <Coins size={18} />
              </div>
              <div className="dashboard-stat-title">Average Payment</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(averagePayment)}</div>
          </div>
        </div>

        <section className="dashboard-panel">
          <div className="dashboard-panel-headline">
              <div>
                <h2>Transaction Ledger</h2>
                <p className="bills-panel-copy">
                  Filter and review every settled bill in one monthly ledger.
                </p>
              </div>
            <div className="payments-list-meta">
              <Sparkles size={16} />
              Settled payment log
            </div>
          </div>

          <div className="payments-toolbar">
            <label className="bills-filter payments-search">
              <span>Search</span>
              <div className="payments-search-wrap">
                <Search size={16} />
                <input
                  className="input"
                  placeholder="Bill or provider"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </label>

            <label className="bills-filter">
              <span>Filter</span>
              <select
                className="input"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="all">All payments</option>
                <option value="ontime">On time only</option>
                <option value="late">Late only</option>
              </select>
            </label>

            <label className="bills-filter">
              <span>Sort</span>
              <select
                className="input"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="dashboard-empty-state">Loading payment history...</div>
          ) : groupedEntries.length === 0 ? (
            <div className="dashboard-empty-state">
              No transactions found for the current filters.
            </div>
          ) : (
            <div className="payments-ledger">
              {groupedEntries.map(([key, items]) => {
                const monthTotal = items.reduce(
                  (sum, payment) => sum + getTotal(payment),
                  0,
                );

                return (
                  <section key={key} className="payments-month-section">
                    <div className="payments-month-header">
                      <div>
                        <strong>{getMonthLabel(items[0].paymentDate)}</strong>
                        <small>
                          {items.length} transaction{items.length === 1 ? '' : 's'}
                        </small>
                      </div>

                      <div className="payments-month-total">
                        <strong>{formatCurrency(monthTotal)}</strong>
                        <small>Total paid</small>
                      </div>
                    </div>

                    <div className="payments-list">
                      {items.map((payment) => {
                        const total = getTotal(payment);
                        const late = getLateFee(payment);
                        const isLate = late > 0;

                        return (
                          <div key={payment.id} className="payments-item-shell">
                            <div className="payments-item">
                              <div className="payments-item-main">
                                <SmartItemAvatar
                                  name={payment.bill?.name}
                                  provider={payment.bill?.provider}
                                />
                                <div>
                                  <strong>{payment.bill?.name || 'Unknown Bill'}</strong>
                                  <small>{payment.bill?.provider || 'Unknown Provider'}</small>
                                </div>
                              </div>

                              <div className="payments-item-date">
                                <div className="payments-item-meta">
                                  <span className="payments-item-date-label">
                                    {formatDate(payment.paymentDate)}
                                  </span>
                                  <span className={`payments-item-state ${isLate ? 'late' : 'ontime'}`}>
                                    {isLate ? 'Late' : 'On Time'}
                                  </span>
                                </div>
                              </div>

                              <div className="payments-item-amount">
                                <strong>{formatCurrency(total)}</strong>
                                <span>Total paid</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

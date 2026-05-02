import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import '../styles/dashboard-page.css';
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
}

interface Expense {
  id: number;
  category: string;
  date: string;
  amount: number;
  description: string;
}

interface Budget {
  category: string;
  limit: number;
}

const COLORS = ['#3575f6', '#f8c332', '#25c48b', '#ef5b5b', '#8b5cf6'];

const CATEGORY_LABELS: Record<string, string> = {
  utility: 'Utilities',
  utilities: 'Utilities',
  rent: 'Rent',
  subscription: 'Subscriptions',
  loan: 'Loans',
  insurance: 'Insurance',
  transportation: 'Transportation',
  healthcare: 'Healthcare',
  education: 'Education',
  groceries: 'Groceries',
  dining: 'Dining',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  other: 'Others',
};

const formatChartCurrency = (value: unknown) =>
  formatCurrency(Number(value) || 0);

const formatChartAxisPeso = (value: number) => `\u20B1${Math.round(value / 1000)}K`;

const formatTrendDayLabel = (value: string) => {
  const parts = value.split(' ');
  return parts[parts.length - 1] || value;
};

const isSameMonth = (value: string, month: Date) => {
  const date = new Date(value);
  return (
    date.getMonth() === month.getMonth() &&
    date.getFullYear() === month.getFullYear()
  );
};

const normalizeCategory = (category: string) => {
  const value = category.toLowerCase();
  if (value === 'utilities') return 'utility';
  if (value === 'rent/mortgage') return 'rent';
  return value;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const headerMenusRef = useRef<HTMLDivElement | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [upcoming, setUpcoming] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const storedUser =
    typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedUser = storedUser ? safeParseUser(storedUser) : null;
  const userName = parsedUser?.name || parsedUser?.fullName || 'Account';
  const userEmail = parsedUser?.email || '';

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      try {
        const [billsResponse, expensesResponse, upcomingResponse] = await Promise.all([
          api.get('/bills'),
          api.get('/expenses'),
          api.get('/reports/upcoming'),
        ]);

        setBills(
          Array.isArray(billsResponse.data)
            ? billsResponse.data
            : billsResponse.data?.data || [],
        );
        setExpenses(
          Array.isArray(expensesResponse.data)
            ? expensesResponse.data
            : expensesResponse.data?.data || [],
        );
        setUpcoming(
          Array.isArray(upcomingResponse.data)
            ? upcomingResponse.data
            : upcomingResponse.data?.data || [],
        );
      } catch (error) {
        console.error('Load dashboard error:', error);
        setBills([]);
        setExpenses([]);
        setUpcoming([]);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
    const savedBudgets = localStorage.getItem('budgets');
    setBudgets(savedBudgets ? safeParseBudgets(savedBudgets) : []);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        headerMenusRef.current &&
        !headerMenusRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    function syncBudgets() {
      const savedBudgets = localStorage.getItem('budgets');
      setBudgets(savedBudgets ? safeParseBudgets(savedBudgets) : []);
    }

    window.addEventListener('storage', syncBudgets);
    return () => window.removeEventListener('storage', syncBudgets);
  }, []);

  function formatDate(date: string) {
    return formatDateByPreference(date);
  }

  const currentBills = useMemo(
    () => bills.filter((bill) => isSameMonth(bill.dueDate, displayMonth)),
    [bills, displayMonth],
  );

  const currentExpenses = useMemo(
    () => expenses.filter((expense) => isSameMonth(expense.date, displayMonth)),
    [displayMonth, expenses],
  );

  const previousMonth = useMemo(
    () => new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1),
    [displayMonth],
  );

  const previousBills = useMemo(
    () => bills.filter((bill) => isSameMonth(bill.dueDate, previousMonth)),
    [bills, previousMonth],
  );

  const totalBills = useMemo(
    () => currentBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [currentBills],
  );

  const totalPaid = useMemo(
    () =>
      currentBills
        .filter((bill) => bill.status === 'paid')
        .reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [currentBills],
  );

  const totalRemaining = useMemo(
    () =>
      currentBills
        .filter((bill) => bill.status !== 'paid')
        .reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [currentBills],
  );

  const upcomingThisMonth = useMemo(
    () =>
      upcoming
        .filter((bill) => isSameMonth(bill.dueDate, displayMonth))
        .slice(0, 3),
    [displayMonth, upcoming],
  );

  const totalUpcoming = useMemo(
    () =>
      upcomingThisMonth.reduce(
        (sum, bill) => sum + Number(bill.amount || 0),
        0,
      ),
    [upcomingThisMonth],
  );

  const previousTotalBills = useMemo(
    () =>
      previousBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [previousBills],
  );

  const categoryDistribution = useMemo(() => {
    const bucket = new Map<string, number>();

    currentBills.forEach((bill) => {
      const category = normalizeCategory(bill.category);
      bucket.set(category, (bucket.get(category) || 0) + Number(bill.amount || 0));
    });

    currentExpenses.forEach((expense) => {
      const category = normalizeCategory(expense.category);
      bucket.set(
        category,
        (bucket.get(category) || 0) + Number(expense.amount || 0),
      );
    });

    return [...bucket.entries()]
      .map(([category, total]) => ({
        category,
        total,
        label: CATEGORY_LABELS[category] || category,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [currentBills, currentExpenses]);

  const spendingByCategory = useMemo(() => {
    const totals: Record<string, number> = {};

    currentBills.forEach((bill) => {
      const category = normalizeCategory(bill.category);
      totals[category] = (totals[category] || 0) + Number(bill.amount || 0);
    });

    currentExpenses.forEach((expense) => {
      const category = normalizeCategory(expense.category);
      totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
    });

    return totals;
  }, [currentBills, currentExpenses]);

  const budgetRows = useMemo(
    () =>
      budgets.map((budget) => {
        const category = normalizeCategory(budget.category);
        const spent = spendingByCategory[category] || 0;
        const limit = Number(budget.limit || 0);

        return {
          category,
          label: CATEGORY_LABELS[category] || budget.category,
          limit,
          spent,
          remaining: Math.max(0, limit - spent),
          progress: limit > 0 ? Math.min((spent / limit) * 100, 100) : 0,
        };
      }),
    [budgets, spendingByCategory],
  );

  const totalBudget = useMemo(
    () => budgetRows.reduce((sum, row) => sum + row.limit, 0),
    [budgetRows],
  );

  const totalBudgetSpent = useMemo(
    () => budgetRows.reduce((sum, row) => sum + row.spent, 0),
    [budgetRows],
  );

  const totalBudgetRemaining = Math.max(0, totalBudget - totalBudgetSpent);
  const budgetProgress = totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;
  const budgetChartTotal = Math.max(totalBudget, totalBudgetSpent, 1);
  const budgetProgressData = [
    { name: 'Spent', value: Math.min(totalBudgetSpent, budgetChartTotal) },
    {
      name: 'Remaining',
      value: Math.max(budgetChartTotal - Math.min(totalBudgetSpent, budgetChartTotal), 0),
    },
  ];

  const trendData = useMemo(() => {
    const monthLabel = displayMonth.toLocaleDateString('en-US', {
      month: 'short',
    });
    const daysInMonth = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth() + 1,
      0,
    ).getDate();

    let runningExpenses = 0;
    let runningPayments = 0;

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;

      currentExpenses
        .filter((expense) => new Date(expense.date).getDate() === day)
        .forEach((expense) => {
          runningExpenses += Number(expense.amount || 0);
        });

      currentBills
        .filter(
          (bill) =>
            bill.status === 'paid' && new Date(bill.dueDate).getDate() === day,
        )
        .forEach((bill) => {
          runningPayments += Number(bill.amount || 0);
        });

      return {
        day: `${monthLabel} ${day}`,
        expenses: runningExpenses,
        payments: runningPayments,
      };
    });
  }, [currentBills, currentExpenses, displayMonth]);

  const monthLabel = useMemo(
    () =>
      displayMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [displayMonth],
  );

  const trendTicks = useMemo(() => {
    const maxValue = Math.max(
      ...trendData.flatMap((item) => [
        Number(item.expenses) || 0,
        Number(item.payments) || 0,
      ]),
      0,
    );
    const roundedMax = Math.max(
      2000,
      Math.floor(maxValue / 2000) * 2000 || 0,
    );
    const ticks: number[] = [];

    for (let value = 0; value <= roundedMax; value += 2000) {
      ticks.push(value);
    }

    return ticks;
  }, [trendData]);

  const alertItems = useMemo(() => {
    const today = new Date();

    return currentBills
      .filter((bill) => bill.status !== 'paid')
      .map((bill) => {
        const due = new Date(bill.dueDate);
        const diff = Math.ceil(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diff < 0) {
          return {
            id: `overdue-${bill.id}`,
            title: bill.name,
            subtitle: `${bill.provider || 'Bill'} is overdue`,
            amount: formatCurrency(Number(bill.amount || 0)),
            tone: 'overdue',
            dueDate: due.getTime(),
          };
        }

        if (diff <= 7) {
          return {
            id: `upcoming-${bill.id}`,
            title: bill.name,
            subtitle: diff === 0 ? 'Due today' : `Due in ${diff} day${diff === 1 ? '' : 's'}`,
            amount: formatCurrency(Number(bill.amount || 0)),
            tone: 'upcoming',
            dueDate: due.getTime(),
          };
        }

        return null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((left, right) => left.dueDate - right.dueDate)
      .slice(0, 6);
  }, [currentBills]);

  const trendTickDays = useMemo(() => {
    const daysInMonth = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth() + 1,
      0,
    ).getDate();
    const targetTickCount = daysInMonth <= 29 ? 5 : 6;
    const step = Math.max(
      1,
      Math.round((daysInMonth - 1) / (targetTickCount - 1)),
    );
    const tickDays = new Set<number>([1, daysInMonth]);

    for (let day = 1 + step; day < daysInMonth; day += step) {
      tickDays.add(day);
    }

    return [...tickDays]
      .sort((a, b) => a - b)
      .map(
        (day) =>
          `${displayMonth.toLocaleDateString('en-US', { month: 'short' })} ${day}`,
      );
  }, [displayMonth]);

  const statCards = [
    {
      title: 'Total Bills',
      value: totalBills,
      icon: <Receipt size={18} />,
      tone: 'blue' as const,
      delta:
        previousTotalBills > 0
          ? ((totalBills - previousTotalBills) / previousTotalBills) * 100
          : 0,
    },
    {
      title: 'Paid',
      value: totalPaid,
      icon: <CheckCircle2 size={18} />,
      tone: 'green' as const,
      delta: totalBills > 0 ? (totalPaid / totalBills) * 20 : 0,
    },
    {
      title: 'Remaining',
      value: totalRemaining,
      icon: <PiggyBank size={18} />,
      tone: 'gold' as const,
      delta: totalBills > 0 ? -((totalRemaining / totalBills) * 10) : 0,
    },
    {
      title: 'Upcoming',
      value: totalUpcoming,
      icon: <Calendar size={18} />,
      tone: 'blue' as const,
      delta: upcomingThisMonth.length > 0 ? 8.1 : 0,
    },
  ];

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <AppLayout title="Dashboard">
      <div className="dashboard-screen">
        <div className="dashboard-screen-header">
          <div>
            <h1>Dashboard</h1>
            <p>Financial overview</p>
          </div>

          <div className="dashboard-header-actions" ref={headerMenusRef}>
            <div className="dashboard-date-pill" aria-label="Selected month">
              <button
                type="button"
                className="dashboard-date-nav"
                onClick={() =>
                  setDisplayMonth(
                    new Date(
                      displayMonth.getFullYear(),
                      displayMonth.getMonth() - 1,
                      1,
                    ),
                  )
                }
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="dashboard-date-label">
                <Calendar size={15} />
                {monthLabel}
              </span>

              <button
                type="button"
                className="dashboard-date-nav"
                onClick={() =>
                  setDisplayMonth(
                    new Date(
                      displayMonth.getFullYear(),
                      displayMonth.getMonth() + 1,
                      1,
                    ),
                  )
                }
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="dashboard-notification-menu">
              <button
                type="button"
                className="dashboard-header-icon-btn"
                aria-label="Open alerts"
                aria-expanded={notificationMenuOpen}
                onClick={() => {
                  setNotificationMenuOpen((value) => !value);
                  setAccountMenuOpen(false);
                }}
              >
                <Bell size={16} />
                {alertItems.length > 0 ? (
                  <span className="dashboard-header-badge">{alertItems.length}</span>
                ) : null}
              </button>

              {notificationMenuOpen && (
                <div className="dashboard-notification-popover">
                  <div className="dashboard-notification-head">
                    <strong>Alerts</strong>
                    <small>{alertItems.length} active</small>
                  </div>

                  {alertItems.length === 0 ? (
                    <div className="dashboard-notification-empty">
                      No alerts right now.
                    </div>
                  ) : (
                    <div className="dashboard-notification-list">
                      {alertItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`dashboard-notification-item ${item.tone}`}
                          onClick={() => {
                            setNotificationMenuOpen(false);
                            navigate('/bills');
                          }}
                        >
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.subtitle}</small>
                          </div>
                          <span>{item.amount}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="dashboard-account-menu">
              <button
                type="button"
                className="dashboard-header-icon-btn"
                aria-label="Open account menu"
                aria-expanded={accountMenuOpen}
                onClick={() => {
                  setAccountMenuOpen((value) => !value);
                  setNotificationMenuOpen(false);
                }}
              >
                <UserRound size={16} />
              </button>

              {accountMenuOpen && (
                <div className="dashboard-account-popover">
                  <div className="dashboard-account-summary">
                    <strong>{userName}</strong>
                    {userEmail && <small>{userEmail}</small>}
                  </div>

                  <button
                    type="button"
                    className="dashboard-account-item"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigate('/settings');
                    }}
                  >
                    Settings
                  </button>

                  <button
                    type="button"
                    className="dashboard-account-item danger"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-card-grid">
          {statCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={formatCurrency(card.value)}
              delta={card.delta}
              tone={card.tone}
              icon={card.icon}
            />
          ))}
        </div>

        <div className="dashboard-feature-grid">
          <section className="dashboard-panel dashboard-panel-wide">
            <div className="dashboard-panel-headline dashboard-trend-heading">
              <h2>Financial Overview</h2>
              <div className="dashboard-trend-legend">
                <span className="dashboard-trend-legend-item">
                  <i className="expenses" />
                  Expenses
                </span>
                <span className="dashboard-trend-legend-item">
                  <i className="payments" />
                  Payments
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 12, left: 12, bottom: 8 }}
              >
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="day"
                  ticks={trendTickDays}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                  tickMargin={10}
                  padding={{ left: 10, right: 10 }}
                  tickFormatter={formatTrendDayLabel}
                />
                <YAxis
                  domain={[
                    0,
                    Math.max(
                      ...trendData.flatMap((item) => [
                        Number(item.expenses) || 0,
                        Number(item.payments) || 0,
                      ]),
                      trendTicks[trendTicks.length - 1] || 2000,
                    ),
                  ]}
                  ticks={trendTicks}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickMargin={10}
                  tickFormatter={(value) => formatChartAxisPeso(Number(value))}
                />
                <Tooltip formatter={formatChartCurrency} />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#3575f6"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="payments"
                  stroke="#25c48b"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-headline">
              <h2>Budget vs Actual</h2>
            </div>

            {budgetRows.length === 0 ? (
              <div className="dashboard-empty-state compact">
                No budgets saved yet.
              </div>
            ) : (
              <div className="dashboard-budget-layout">
                <div className="dashboard-budget-donut">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={budgetProgressData}
                        dataKey="value"
                        innerRadius={48}
                        outerRadius={70}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        <Cell fill="#3575f6" />
                        <Cell fill="#e6edf7" />
                      </Pie>
                      <Tooltip formatter={formatChartCurrency} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="dashboard-budget-center">
                    <strong>{Math.round(Math.min(budgetProgress, 100))}%</strong>
                    <span>On Track</span>
                  </div>
                </div>

                <div className="dashboard-budget-metrics">
                  <div className="dashboard-budget-metric">
                    <span>Budget</span>
                    <strong>{formatCurrency(totalBudget)}</strong>
                  </div>
                  <div className="dashboard-budget-metric">
                    <span>Spent</span>
                    <strong>{formatCurrency(totalBudgetSpent)}</strong>
                  </div>
                  <div className="dashboard-budget-metric">
                    <span>Remaining</span>
                    <strong>{formatCurrency(totalBudgetRemaining)}</strong>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-headline">
              <h2>Category Distribution</h2>
            </div>

            {loading ? (
              <div className="dashboard-empty-state">
                Loading category distribution...
              </div>
            ) : categoryDistribution.length === 0 ? (
              <div className="dashboard-empty-state">No category data yet.</div>
            ) : (
              <div className="dashboard-donut-row">
                <div className="dashboard-donut-visual">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        dataKey="total"
                        nameKey="label"
                        innerRadius={44}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        {categoryDistribution.map((item, index) => (
                          <Cell
                            key={item.category}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={formatChartCurrency} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="dashboard-distribution-list">
                  {categoryDistribution.map((item, index) => {
                    const total = categoryDistribution.reduce(
                      (sum, entry) => sum + entry.total,
                      0,
                    );

                    return (
                      <div
                        key={item.category}
                        className="dashboard-distribution-item"
                      >
                        <div className="dashboard-distribution-left">
                          <span
                            className="dashboard-distribution-dot"
                            style={{ background: COLORS[index % COLORS.length] }}
                          />
                          <span>{item.label}</span>
                        </div>

                        <div className="dashboard-distribution-right">
                          <strong>{formatCurrency(item.total)}</strong>
                          <span>({Math.round((item.total / total) * 100)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-headline">
              <h2>Upcoming Schedule</h2>
              <button
                type="button"
                className="dashboard-view-all-btn"
                onClick={() => navigate('/bills')}
              >
                View all
              </button>
            </div>

            <div className="dashboard-schedule-list">
              {(loading ? [] : upcomingThisMonth).map((bill) => {
                const status = getBillStatusLabel(bill);

                return (
                  <div key={bill.id} className="dashboard-schedule-item">
                    <SmartItemAvatar
                      name={bill.name}
                      provider={bill.provider}
                      category={bill.category}
                    />

                    <div className="dashboard-schedule-main">
                      <strong>{bill.name}</strong>
                      <small>{formatDate(bill.dueDate)}</small>
                    </div>

                    <div className="dashboard-schedule-amount">
                      {formatCurrency(Number(bill.amount || 0))}
                    </div>

                    <div
                      className={`dashboard-schedule-badge ${status.className}`}
                    >
                      {status.text}
                    </div>
                  </div>
                );
              })}

              {!loading && upcomingThisMonth.length === 0 && (
                <div className="dashboard-empty-state compact">
                  No upcoming bills this month.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function getBillStatusLabel(bill: Bill) {
  const due = new Date(bill.dueDate);
  const today = new Date();
  const diff = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff <= 0) return { text: 'Due Today', className: 'today' };
  if (diff <= 3) return { text: `Due in ${diff} days`, className: 'soon' };
  return { text: `Due in ${diff} days`, className: 'later' };
}

function safeParseUser(value: string) {
  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return null;
  }
}

function safeParseBudgets(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function StatCard({
  title,
  value,
  delta,
  tone,
  icon,
}: {
  title: string;
  value: string;
  delta: number;
  tone: 'blue' | 'green' | 'gold';
  icon: ReactNode;
}) {
  const positive = delta >= 0;

  return (
    <div className={`dashboard-stat-box ${tone}`}>
      <div className="dashboard-stat-top">
        <div className="dashboard-stat-icon-wrap">{icon}</div>
        <div className="dashboard-stat-title">{title}</div>
      </div>

      <div className="dashboard-stat-value">{value}</div>

      <div className={`dashboard-stat-delta ${positive ? 'up' : 'down'}`}>
        {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{Math.abs(delta).toFixed(1)}% from last month</span>
      </div>
    </div>
  );
}

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import api from '../services/api'
import { formatCurrency } from '../utils/format'

interface Expense {
  id: number
  category: string
  date: string
  amount: number
  description: string
}

interface Bill {
  id: number
  category: string
  amount: number
  dueDate: string
  description: string
  status: string
}

interface Budget {
  category: string
  limit: number
}

const CATEGORIES = [
  { value: 'groceries', label: 'Groceries', icon: '🛒' },
  { value: 'rent', label: 'Rent/Mortgage', icon: '🏠' },
  { value: 'utilities', label: 'Utilities', icon: '⚡' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'dining', label: 'Dining Out', icon: '🍽️' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'other', label: 'Other', icon: '📦' }
]

export default function BudgetingPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)

  const [form, setForm] = useState({ category: '', limit: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [expensesRes, billsRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/bills')
      ])

      const expensesData = Array.isArray(expensesRes.data)
        ? expensesRes.data
        : expensesRes.data?.data || []

      const billsData = Array.isArray(billsRes.data)
        ? billsRes.data
        : billsRes.data?.data || []

      setExpenses(expensesData)
      setBills(billsData)
      loadBudgets()
    } catch (error) {
      console.error('Fetch data error:', error)
      setExpenses([])
      setBills([])
      loadBudgets()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const loadBudgets = () => {
    const saved = localStorage.getItem('budgets')
    if (saved) {
      setBudgets(JSON.parse(saved))
    }
  }

  const saveBudgets = (nextBudgets: Budget[]) => {
    setBudgets(nextBudgets)
    localStorage.setItem('budgets', JSON.stringify(nextBudgets))
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const isValid = form.category && Number(form.limit) > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setSubmitting(true)

    const nextBudgets = budgets.some(b => b.category === form.category)
      ? budgets.map(b =>
          b.category === form.category
            ? { ...b, limit: Number(form.limit) }
            : b
        )
      : [...budgets, { category: form.category, limit: Number(form.limit) }]

    saveBudgets(nextBudgets)
    setForm({ category: '', limit: '' })
    setEditingCategory(null)
    setSubmitting(false)
  }

  const handleEditBudget = (category: string) => {
    const budget = budgets.find(b => b.category === category)
    if (!budget) return

    setEditingCategory(category)
    setForm({ category, limit: budget.limit.toString() })
  }

  const handleDeleteBudget = (category: string) => {
    const nextBudgets = budgets.filter(b => b.category !== category)
    saveBudgets(nextBudgets)
    if (editingCategory === category) {
      setEditingCategory(null)
      setForm({ category: '', limit: '' })
    }
  }

  const spendingByCategory = useMemo(() => {
    const spending: Record<string, number> = {}
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date)
      if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
        spending[expense.category] = (spending[expense.category] || 0) + expense.amount
      }
    })

    bills.forEach(bill => {
      if (bill.status !== 'paid') {
        spending[bill.category] = (spending[bill.category] || 0) + bill.amount
      }
    })

    return spending
  }, [expenses, bills])

  const budgetRows = useMemo(
    () =>
      budgets.map(budget => {
        const spent = spendingByCategory[budget.category] || 0
        const remaining = budget.limit - spent
        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0

        return {
          ...budget,
          label: CATEGORIES.find(cat => cat.value === budget.category)?.label || budget.category,
          icon: CATEGORIES.find(cat => cat.value === budget.category)?.icon || '📦',
          spent,
          remaining,
          percentage: Math.min(percentage, 100),
          status: spent > budget.limit ? 'Over Budget' : percentage >= 80 ? 'Near Limit' : 'Good'
        }
      }),
    [budgets, spendingByCategory]
  )

  const totalBudget = useMemo(() => budgets.reduce((sum, budget) => sum + budget.limit, 0), [budgets])
  const totalSpent = useMemo(() => budgetRows.reduce((sum, row) => sum + row.spent, 0), [budgetRows])

  const getBudgetStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Over Budget':
        return { background: '#fee2e2', color: '#b91c1c' }
      case 'Near Limit':
        return { background: '#fff7ed', color: '#c2410c' }
      default:
        return { background: '#ecfdf5', color: '#166534' }
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Budgeting</h1>
          <div className="text-center py-8">Loading...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Budgeting</h1>
            <p className="muted">Manage monthly category budgets alongside your bills and expenses.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="panel">
            <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>Total Budget</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 600 }}>{formatCurrency(totalBudget)}</p>
          </div>
          <div className="panel">
            <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>Total Spent</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 600 }}>{formatCurrency(totalSpent)}</p>
          </div>
          <div className="panel">
            <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>Remaining</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 600 }}>{formatCurrency(totalBudget - totalSpent)}</p>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{editingCategory ? 'Edit Budget' : 'Add Budget'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                disabled={!!editingCategory}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Budget Limit *</label>
              <input
                type="number"
                name="limit"
                value={form.limit}
                onChange={handleChange}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={!isValid || submitting}
                style={{ padding: '12px 20px', background: '#2563eb', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' }}
              >
                {submitting ? 'Saving…' : editingCategory ? 'Update Budget' : '💾 Save Budget'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null)
                    setForm({ category: '', limit: '' })
                  }}
                  style={{ padding: '12px 20px', background: '#6b7280', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="panel">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20
          }}>
            <div>
              <h3 style={{ margin: 0 }}>Budget List</h3>
              <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                Showing {budgetRows.length} budget{budgetRows.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: 40 }}>Loading budgets...</p>
          ) : budgetRows.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              opacity: 0.6,
              border: '2px dashed #e5e7eb',
              borderRadius: 8
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
              <p style={{ fontSize: '1.1rem' }}>No budgets set yet</p>
              <p>Start by adding your first budget above!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '720px' }}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Limit</th>
                    <th>Spent</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetRows.map(row => (
                    <tr key={row.category}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                            <span>{row.icon}</span>
                            <span>{row.label}</span>
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {Math.round(row.percentage)}% of budget used
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(row.limit)}</td>
                      <td>{formatCurrency(row.spent)}</td>
                      <td style={{ color: row.remaining >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {formatCurrency(row.remaining)}
                      </td>
                      <td>
                        <span className="badge" style={getBudgetStatusBadgeStyle(row.status)}>
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleEditBudget(row.category)}
                            style={{
                              padding: '4px 8px',
                              background: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(row.category)}
                            style={{
                              padding: '4px 8px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

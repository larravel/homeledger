import { useEffect, useState, useMemo } from 'react'
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

const CATEGORY_ICONS: Record<string, string> = {
  groceries: '🛒',
  rent: '🏠',
  utilities: '⚡',
  transportation: '🚗',
  entertainment: '🎬',
  healthcare: '🏥',
  insurance: '🛡️',
  education: '📚',
  dining: '🍽️',
  shopping: '🛍️',
  other: '📦'
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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [form, setForm] = useState({
    category: '',
    date: '',
    amount: '',
    description: ''
  })

  // ✅ FIX: supports different API response shapes + error handling
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/expenses')

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || []

      setExpenses(data)
    } catch (err) {
      console.error('Fetch expenses error:', err)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ✅ FIX: proper typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const isValid = form.category && form.date && Number(form.amount) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setSubmitting(true)

    try {
      await api.post('/expenses', {
        category: form.category,
        date: form.date,
        amount: Number(form.amount),
        description: form.description || ''
      })

      setForm({ category: '', date: '', amount: '', description: '' })
      await fetchData()
    } catch (err) {
      console.error('Save expense error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return

    setDeletingId(id)
    try {
      await api.delete(`/expenses/${id}`)
      await fetchData()
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredExpenses = useMemo(() => {
    if (!filterCategory) return expenses
    return expenses.filter(e => e.category === filterCategory)
  }, [expenses, filterCategory])

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [filteredExpenses]
  )

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}

    filteredExpenses.forEach(e => {
      const amount = Number(e.amount) || 0
      breakdown[e.category] = (breakdown[e.category] || 0) + amount
    })

    return Object.entries(breakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredExpenses])

  // ✅ FIX: prevents "Invalid Date"
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <AppLayout>
          <div className="page-container">
    
            {/* HEADER */}
            <div className="page-header">
              <div>
                <h1>Household Expenses</h1>
                <p className="muted">Track and manage all your household expenses in one place</p>
              </div>
            </div>

        {/* SUMMARY CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          <div className="panel">
            <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
              Total Expenses
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 600 }}>
              {formatCurrency(totalExpenses || 0)}
            </p>
          </div>

          <div className="panel">
            <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
              Number of Expenses
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 600 }}>
              {filteredExpenses.length}
            </p>
          </div>

          <div className="panel">
            <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
              Average Expense
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 600 }}>
              {formatCurrency(filteredExpenses.length ? totalExpenses / filteredExpenses.length : 0)}
            </p>
          </div>
        </div>

        {/* CATEGORY BREAKDOWN */}
        {categoryBreakdown.length > 0 && (
          <div className="panel" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Expenses by Category</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12
            }}>
              {categoryBreakdown.slice(0, 6).map(({ category, amount }) => (
                <div key={category} style={{
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>
                    {CATEGORY_ICONS[category] || '📦'}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    {CATEGORIES.find(c => c.value === category)?.label || category}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    {formatCurrency(amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD EXPENSE FORM */}
        <div className="panel" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Add New Expense</h3>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              alignItems: 'end'
            }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #d1d5db' }}
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Description
              </label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional details"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </div>

            <div>
              <button
                className="primary-btn"
                type="submit"
                disabled={!isValid || submitting}
                style={{ width: '100%', padding: '10px' }}
              >
                {submitting ? 'Saving...' : '💾 Save Expense'}
              </button>
            </div>
          </form>
        </div>

        {/* EXPENSE HISTORY */}
        <div className="panel">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <h3 style={{ margin: 0 }}>Expense History</h3>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                Filter by Category:
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: 40 }}>Loading expenses...</p>
          ) : filteredExpenses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              opacity: 0.6,
              border: '2px dashed #e5e7eb',
              borderRadius: 8
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>💰</div>
              <p style={{ fontSize: '1.1rem' }}>
                {filterCategory ? 'No expenses found for this category' : 'No expenses recorded yet'}
              </p>
              <p>Start by adding your first expense above!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '600px' }}>
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{CATEGORY_ICONS[expense.category] || '📦'}</span>
                          <span>{CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}</span>
                        </span>
                      </td>
                      <td>{formatDate(expense.date)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(expense.amount || 0)}</td>
                      <td>{expense.description || '-'}</td>
                      <td>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
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
                          {deletingId === expense.id ? 'Deleting...' : '🗑️ Delete'}
                        </button>
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
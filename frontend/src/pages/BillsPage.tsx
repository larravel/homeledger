import { useEffect, useState, useMemo } from 'react'
import AppLayout from '../layouts/AppLayout'
import api from '../services/api'
import { formatCurrency } from '../utils/format'
import { Receipt, DollarSign, AlertTriangle, Clock } from 'lucide-react'

interface Bill {
  id: number
  name: string
  provider: string
  amount: number
  dueDate: string
  status: string
  category: string
  isRecurring: boolean
  frequency: string | null
}

const CATEGORY_ICONS: Record<string, string> = {
  utility: '⚡',
  rent: '🏠',
  subscription: '📱',
  loan: '💳',
  insurance: '🛡️',
  transportation: '🚗',
  healthcare: '🏥',
  education: '🎓'
}

const CATEGORIES = [
  { value: 'utility', label: 'Utilities', icon: '⚡' },
  { value: 'rent', label: 'Rent/Mortgage', icon: '🏠' },
  { value: 'subscription', label: 'Subscriptions', icon: '📱' },
  { value: 'loan', label: 'Loans', icon: '💳' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '🎓' }
]

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateRange, setFilterDateRange] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [form, setForm] = useState({
    name: '',
    provider: '',
    amount: '',
    dueDate: '',
    category: ''
  })

  // ✅ FIX: supports different API response shapes + error handling
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/bills')

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || []

      setBills(data)
    } catch (err) {
      console.error('Fetch bills error:', err)
      setBills([])
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

  const isValid = form.name && form.provider && Number(form.amount) > 0 && form.dueDate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setSubmitting(true)

    try {
      await api.post('/bills', {
        name: form.name.trim(),
        provider: form.provider.trim(),
        amount: Number(form.amount),
        dueDate: form.dueDate,
        category: form.category,
        isRecurring: false
      })

      setForm({ name: '', provider: '', amount: '', dueDate: '', category: '' })
      await fetchData()
    } catch (err) {
      console.error('Save bill error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return

    setDeletingId(id)
    try {
      await api.delete(`/bills/${id}`)
      await fetchData()
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handlePay = async (bill: Bill) => {
    try {
      await api.post(`/payments/bill/${bill.id}`, {
        paymentDate: new Date().toISOString().split('T')[0],
      })
      await fetchData()
    } catch (err) {
      console.error('Pay bill error:', err)
    }
  }

  // Helper functions for filtering
  const getBillStatus = (bill: Bill) => {
    if (bill.status === 'paid') return 'paid'
    
    const today = new Date()
    const due = new Date(bill.dueDate)
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    
    if (due < today) return 'overdue'
    if (diff <= 7 && diff >= 0) return 'dueSoon'
    return 'unpaid'
  }

  const isDateInRange = (dateString: string, range: string, from?: string, to?: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    switch (range) {
      case 'thisMonth':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      case 'lastMonth': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()
      }
      case 'custom': {
        if (!from || !to) return true
        const fromDate = new Date(from)
        const toDate = new Date(to)
        return date >= fromDate && date <= toDate
      }
      default:
        return true
    }
  }

  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          bill.name.toLowerCase().includes(query) || 
          bill.provider.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Category filter
      if (filterCategory && bill.category !== filterCategory) {
        return false
      }

      // Status filter
      if (filterStatus) {
        const billStatus = getBillStatus(bill)
        if (billStatus !== filterStatus) return false
      }

      // Date range filter
      if (filterDateRange && !isDateInRange(bill.dueDate, filterDateRange, customDateFrom, customDateTo)) {
        return false
      }

      return true
    })
  }, [bills, searchQuery, filterCategory, filterStatus, filterDateRange, customDateFrom, customDateTo])

  const totalBills = filteredBills.length

  const totalAmount = useMemo(
    () => filteredBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0),
    [filteredBills]
  )

  const unpaidAmount = useMemo(
    () => filteredBills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + (Number(b.amount) || 0), 0),
    [filteredBills]
  )

  const overdueCount = useMemo(
    () => filteredBills.filter(b => b.status !== 'paid' && new Date(b.dueDate) < new Date()).length,
    [filteredBills]
  )

  const dueSoonCount = useMemo(
    () => {
      const today = new Date()
      return filteredBills.filter(b => {
        if (b.status === 'paid') return false
        const due = new Date(b.dueDate)
        const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        return diff <= 7 && diff >= 0
      }).length
    },
    [filteredBills]
  )

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}

    filteredBills.forEach(b => {
      const amount = Number(b.amount) || 0
      breakdown[b.category] = (breakdown[b.category] || 0) + amount
    })

    return Object.entries(breakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredBills])

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

  const getStatusBadge = (bill: Bill) => {
    const status = getBillStatus(bill)
    switch (status) {
      case 'paid': return { text: 'Paid', class: 'paid' }
      case 'overdue': return { text: 'Overdue', class: 'overdue' }
      case 'dueSoon': return { text: 'Due Soon', class: 'dueSoon' }
      default: return { text: 'Unpaid', class: 'unpaid' }
    }
  }

  return (
    <AppLayout>
      <div className="dashboard-screen">
        {/* HEADER */}
        <div className="dashboard-screen-header">
          <div>
            <h1>Household Bills</h1>
            <p>Track and manage all your household bills and financial obligations</p>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="dashboard-card-grid">
          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <Receipt size={18} />
              </div>
              <div className="dashboard-stat-title">Total Bills</div>
            </div>
            <div className="dashboard-stat-value">{totalBills}</div>
          </div>

          <div className="dashboard-stat-box green">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <DollarSign size={18} />
              </div>
              <div className="dashboard-stat-title">Total Amount</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(totalAmount || 0)}</div>
          </div>

          <div className="dashboard-stat-box gold">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <AlertTriangle size={18} />
              </div>
              <div className="dashboard-stat-title">Unpaid Amount</div>
            </div>
            <div className="dashboard-stat-value">{formatCurrency(unpaidAmount || 0)}</div>
          </div>

          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <Clock size={18} />
              </div>
              <div className="dashboard-stat-title">Overdue Bills</div>
            </div>
            <div className="dashboard-stat-value">{overdueCount}</div>
          </div>
        </div>

        {/* DUE SOON ALERT */}
        {dueSoonCount > 0 && (
          <div className="dashboard-panel" style={{ 
            marginBottom: 24, 
            border: '1px solid #facc15', 
            background: '#fefce822' 
          }}>
            <h3 style={{ marginBottom: 8, color: '#facc15' }}>⚠️ Bills Due Soon</h3>
            <p>You have {dueSoonCount} bill(s) due within the next 7 days. Don't forget to pay them on time!</p>
          </div>
        )}

        {/* CATEGORY BREAKDOWN */}
        {categoryBreakdown.length > 0 && (
          <div className="dashboard-panel" style={{ marginBottom: 24 }}>
            <div className="dashboard-panel-headline">
              <h2>Bills by Category</h2>
            </div>
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

        {/* ADD BILL FORM */}
        <div className="dashboard-panel" style={{ marginBottom: 24 }}>
          <div className="dashboard-panel-headline">
            <h2>Add New Bill</h2>
          </div>

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
                Bill Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Electricity Bill"
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Provider *
              </label>
              <input
                type="text"
                name="provider"
                value={form.provider}
                onChange={handleChange}
                placeholder="e.g., ConEd, Verizon"
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </div>

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
                Due Date *
              </label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
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
              <button
                className="primary-btn"
                type="submit"
                disabled={!isValid || submitting}
                style={{ width: '100%', padding: '10px' }}
              >
                {submitting ? 'Saving...' : '💾 Save Bill'}
              </button>
            </div>
          </form>
        </div>

        {/* BILL HISTORY */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-headline">
            <div>
              <h2>Bill History</h2>
              <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                Showing {filteredBills.length} bill{filteredBills.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* FILTERS */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Bill name or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                  minWidth: 200
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                  minWidth: 160
                }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                  minWidth: 140
                }}
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="dueSoon">Due Soon</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>
                Date Range
              </label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                  minWidth: 140
                }}
              >
                <option value="">All Dates</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {filterDateRange === 'custom' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>
                    From
                  </label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>
                    To
                  </label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </>
            )}

            <button
              onClick={() => {
                setSearchQuery('')
                setFilterCategory('')
                setFilterStatus('')
                setFilterDateRange('')
                setCustomDateFrom('')
                setCustomDateTo('')
              }}
              style={{
                padding: '8px 14px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Reset
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: 40 }}>Loading bills...</p>
          ) : filteredBills.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              opacity: 0.6,
              border: '2px dashed #e5e7eb',
              borderRadius: 8
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>💰</div>
              <p style={{ fontSize: '1.1rem' }}>
                {searchQuery || filterCategory.length > 0 || filterStatus.length > 0 || filterDateRange
                  ? 'No bills match your current filters'
                  : 'No bills recorded yet'}
              </p>
              <p>Start by adding your first bill above!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th>Bill Name</th>
                    <th>Provider</th>
                    <th>Category</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => {
                    const statusBadge = getStatusBadge(bill)
                    return (
                      <tr key={bill.id}>
                        <td style={{ fontWeight: 600 }}>{bill.name}</td>
                        <td>{bill.provider}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{CATEGORY_ICONS[bill.category] || '📦'}</span>
                            <span>{CATEGORIES.find(c => c.value === bill.category)?.label || bill.category}</span>
                          </span>
                        </td>
                        <td>{formatDate(bill.dueDate)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(bill.amount || 0)}</td>
                        <td>
                          <span className={`badge ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {bill.status !== 'paid' && (
                              <button
                                onClick={() => handlePay(bill)}
                                style={{
                                  padding: '4px 8px',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                ✅ Pay
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(bill.id)}
                              disabled={deletingId === bill.id}
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
                              {deletingId === bill.id ? 'Deleting...' : '🗑️ Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
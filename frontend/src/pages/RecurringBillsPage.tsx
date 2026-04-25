import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import api from '../services/api'
import { formatCurrency } from '../utils/format'

interface RecurringBill {
  id: number
  name: string
  provider: string
  amount: number
  category: string
  frequency: 'monthly' | 'quarterly'
  startDate: string
  lastGenerated: string | null
  userId: number
  createdAt: string
  updatedAt: string
}

interface NoticeState {
  type: 'success' | 'error'
  message: string
}

const CATEGORIES = [
  { value: 'utility', label: 'Utilities' },
  { value: 'rent', label: 'Rent / Mortgage' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'loan', label: 'Loans' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
]

const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
]

const INPUT_STYLE = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#fff',
  font: 'inherit',
} as const

const getCycleMonths = (frequency: 'monthly' | 'quarterly') =>
  frequency === 'monthly' ? 1 : 3

const parseDate = (value: string) => new Date(`${value}T00:00:00`)

const formatDateValue = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addMonths = (dateString: string, months: number) => {
  const nextDate = parseDate(dateString)
  nextDate.setMonth(nextDate.getMonth() + months)
  return formatDateValue(nextDate)
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getMonthlyEquivalent = (bill: Pick<RecurringBill, 'amount' | 'frequency'>) =>
  bill.frequency === 'monthly' ? Number(bill.amount) || 0 : (Number(bill.amount) || 0) / 3

const getNextRunDate = (bill: Pick<RecurringBill, 'startDate' | 'lastGenerated' | 'frequency'>) =>
  bill.lastGenerated
    ? addMonths(bill.lastGenerated, getCycleMonths(bill.frequency))
    : bill.startDate

const getScheduleStatus = (bill: Pick<RecurringBill, 'startDate' | 'lastGenerated' | 'frequency'>) => {
  const today = formatDateValue(new Date())
  const nextRunDate = getNextRunDate(bill)

  if (nextRunDate > today) {
    return {
      label: bill.lastGenerated ? 'Scheduled' : 'Starts Later',
      style: { background: '#e0f2fe', color: '#075985' },
    }
  }

  return {
    label: 'Due Now',
    style: { background: '#fef3c7', color: '#92400e' },
  }
}

export default function RecurringBillsPage() {
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterFrequency, setFilterFrequency] = useState('')
  const [notice, setNotice] = useState<NoticeState | null>(null)

  const [form, setForm] = useState({
    name: '',
    provider: '',
    amount: '',
    category: '',
    frequency: '',
    startDate: '',
  })

  const resetForm = () => {
    setEditingId(null)
    setForm({
      name: '',
      provider: '',
      amount: '',
      category: '',
      frequency: '',
      startDate: '',
    })
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/recurring-bills')
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || []
      setRecurringBills(data)
    } catch (err) {
      console.error('Fetch recurring bills error:', err)
      setRecurringBills([])
      setNotice({
        type: 'error',
        message: 'Unable to load recurring bills right now.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const isValid =
    form.name.trim() &&
    form.provider.trim() &&
    Number(form.amount) > 0 &&
    form.category &&
    form.frequency &&
    form.startDate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setSubmitting(true)
    setNotice(null)

    const payload = {
      name: form.name.trim(),
      provider: form.provider.trim(),
      amount: Number(form.amount),
      category: form.category,
      frequency: form.frequency,
      startDate: form.startDate,
    }

    try {
      if (editingId) {
        await api.patch(`/recurring-bills/${editingId}`, payload)
        setNotice({
          type: 'success',
          message: 'Recurring bill updated successfully.',
        })
      } else {
        await api.post('/recurring-bills', payload)
        setNotice({
          type: 'success',
          message: 'Recurring bill added successfully.',
        })
      }

      resetForm()
      await fetchData()
    } catch (err) {
      console.error('Save recurring bill error:', err)
      setNotice({
        type: 'error',
        message: 'Could not save the recurring bill. Please check your inputs.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (bill: RecurringBill) => {
    setEditingId(bill.id)
    setNotice(null)
    setForm({
      name: bill.name,
      provider: bill.provider,
      amount: String(bill.amount),
      category: bill.category,
      frequency: bill.frequency,
      startDate: bill.startDate,
    })
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this recurring bill and stop future bill generation?')) return

    setDeletingId(id)
    setNotice(null)

    try {
      await api.delete(`/recurring-bills/${id}`)
      if (editingId === id) {
        resetForm()
      }
      setNotice({
        type: 'success',
        message: 'Recurring bill deleted successfully.',
      })
      await fetchData()
    } catch (err) {
      console.error('Delete recurring bill error:', err)
      setNotice({
        type: 'error',
        message: 'Could not delete the recurring bill.',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleGenerateBills = async () => {
    setGenerating(true)
    setNotice(null)

    try {
      const response = await api.post('/recurring-bills/generate')
      const message =
        typeof response.data?.message === 'string'
          ? response.data.message
          : 'Recurring bills processed successfully.'

      setNotice({
        type: 'success',
        message,
      })
      await fetchData()
    } catch (err) {
      console.error('Generate recurring bills error:', err)
      setNotice({
        type: 'error',
        message: 'Could not run the recurring billing cycle.',
      })
    } finally {
      setGenerating(false)
    }
  }

  const filteredBills = useMemo(() => {
    return recurringBills.filter((bill) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          bill.name.toLowerCase().includes(query) ||
          bill.provider.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      if (filterCategory && bill.category !== filterCategory) {
        return false
      }

      if (filterFrequency && bill.frequency !== filterFrequency) {
        return false
      }

      return true
    })
  }, [recurringBills, searchQuery, filterCategory, filterFrequency])

  const totalRecurringBills = filteredBills.length

  const monthlyCommitment = useMemo(
    () => filteredBills.reduce((sum, bill) => sum + getMonthlyEquivalent(bill), 0),
    [filteredBills],
  )

  const dueNowCount = useMemo(() => {
    const today = formatDateValue(new Date())
    return filteredBills.filter((bill) => getNextRunDate(bill) <= today).length
  }, [filteredBills])

  const categoryCount = useMemo(
    () => new Set(filteredBills.map((bill) => bill.category)).size,
    [filteredBills],
  )

  const annualProjection = monthlyCommitment * 12

  const nextUpcomingRun = useMemo(() => {
    if (filteredBills.length === 0) return null

    return [...filteredBills]
      .map((bill) => getNextRunDate(bill))
      .sort((a, b) => a.localeCompare(b))[0]
  }, [filteredBills])

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}

    filteredBills.forEach((bill) => {
      breakdown[bill.category] = (breakdown[bill.category] || 0) + getMonthlyEquivalent(bill)
    })

    return Object.entries(breakdown)
      .map(([category, amount]) => ({
        category,
        label: CATEGORIES.find((item) => item.value === category)?.label || category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredBills])

  return (
    <AppLayout>
      <div className="page-container">
        <div
          className="panel"
          style={{
            marginBottom: 24,
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(37, 99, 235, 0.92))',
            color: 'white',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 'auto -80px -120px auto',
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
              position: 'relative',
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <p
                style={{
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: '0.8rem',
                  opacity: 0.8,
                }}
              >
                Recurring Billing Control Center
              </p>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>Recurring Bills</h1>
              <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, opacity: 0.9 }}>
                Manage subscriptions, rent, utilities, and other repeating obligations from one
                schedule-aware workspace. Generate due bills on demand and keep the monthly
                commitment view current.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="primary-btn"
                onClick={handleGenerateBills}
                disabled={generating}
                style={{
                  background: 'white',
                  color: '#0f172a',
                  minWidth: 180,
                  fontWeight: 700,
                }}
              >
                {generating ? 'Running cycle...' : 'Generate Due Bills'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                  style={{
                    background: 'rgba(255, 255, 255, 0.16)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {notice && (
          <div className={`alert ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {notice.message}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div className="panel">
            <h4 style={{ margin: 0, fontSize: '0.85rem', opacity: 0.65 }}>Active Schedules</h4>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.9rem', fontWeight: 700 }}>
              {totalRecurringBills}
            </p>
          </div>

          <div className="panel">
            <h4 style={{ margin: 0, fontSize: '0.85rem', opacity: 0.65 }}>Monthly Commitment</h4>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.9rem', fontWeight: 700 }}>
              {formatCurrency(monthlyCommitment)}
            </p>
          </div>

          <div className="panel">
            <h4 style={{ margin: 0, fontSize: '0.85rem', opacity: 0.65 }}>Due Right Now</h4>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.9rem', fontWeight: 700 }}>{dueNowCount}</p>
          </div>

          <div className="panel">
            <h4 style={{ margin: 0, fontSize: '0.85rem', opacity: 0.65 }}>Annual Projection</h4>
            <p style={{ margin: '8px 0 0 0', fontSize: '1.9rem', fontWeight: 700 }}>
              {formatCurrency(annualProjection)}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div className="panel">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>{editingId ? 'Edit Recurring Bill' : 'Add Recurring Bill'}</h3>
                <p style={{ margin: '6px 0 0 0', color: '#6b7280' }}>
                  Set the cadence once and let HomeLedger keep the cycle organized.
                </p>
              </div>
              <span
                className="badge"
                style={{
                  background: editingId ? '#dbeafe' : '#dcfce7',
                  color: editingId ? '#1d4ed8' : '#166534',
                }}
              >
                {editingId ? 'Edit Mode' : 'Automation Ready'}
              </span>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                alignItems: 'end',
              }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Bill Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Internet service"
                  required
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Provider *</label>
                <input
                  type="text"
                  name="provider"
                  value={form.provider}
                  onChange={handleChange}
                  placeholder="Provider name"
                  required
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  style={INPUT_STYLE}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Frequency *</label>
                <select
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  required
                  style={INPUT_STYLE}
                >
                  <option value="">Select frequency</option>
                  {FREQUENCIES.map((frequency) => (
                    <option key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  style={INPUT_STYLE}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={!isValid || submitting}
                  style={{ minWidth: 150 }}
                >
                  {submitting
                    ? 'Saving...'
                    : editingId
                      ? 'Update Schedule'
                      : 'Save Schedule'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Portfolio Snapshot</h3>

            <div style={{ display: 'grid', gap: 12 }}>
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 6 }}>
                  Next upcoming run
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {nextUpcomingRun ? formatDate(nextUpcomingRun) : 'No schedules yet'}
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 6 }}>
                  Categories covered
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{categoryCount}</div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 10 }}>
                  Highest monthly load
                </div>
                {categoryBreakdown.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                      {categoryBreakdown[0].label}
                    </div>
                    <div style={{ color: '#475569' }}>
                      {formatCurrency(categoryBreakdown[0].amount)} / month
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#64748b' }}>Add a schedule to see category insights.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {categoryBreakdown.length > 0 && (
          <div className="panel" style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Monthly Cost Mix</h3>
                <p style={{ margin: '6px 0 0 0', color: '#6b7280' }}>
                  Normalized monthly cost by recurring bill category.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              {categoryBreakdown.map((item) => {
                const share = monthlyCommitment > 0 ? (item.amount / monthlyCommitment) * 100 : 0
                return (
                  <div
                    key={item.category}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: '1px solid #e5e7eb',
                      background: 'linear-gradient(180deg, #ffffff, #f8fafc)',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 8 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10 }}>
                      {formatCurrency(item.amount)}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 8,
                        borderRadius: 999,
                        background: '#e2e8f0',
                        overflow: 'hidden',
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(share, 100)}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: 'linear-gradient(90deg, #0f172a, #2563eb)',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {share.toFixed(0)}% of monthly recurring load
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>Recurring Bill Portfolio</h3>
              <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                Showing {filteredBills.length} schedule{filteredBills.length === 1 ? '' : 's'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 600 }}>
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Bill or provider"
                  style={{ ...INPUT_STYLE, minWidth: 220, padding: '8px 10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 600 }}>
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ ...INPUT_STYLE, minWidth: 180, padding: '8px 10px' }}
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 600 }}>
                  Frequency
                </label>
                <select
                  value={filterFrequency}
                  onChange={(e) => setFilterFrequency(e.target.value)}
                  style={{ ...INPUT_STYLE, minWidth: 160, padding: '8px 10px' }}
                >
                  <option value="">All frequencies</option>
                  {FREQUENCIES.map((frequency) => (
                    <option key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setSearchQuery('')
                  setFilterCategory('')
                  setFilterFrequency('')
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: 40 }}>Loading recurring bills...</p>
          ) : filteredBills.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 48,
                border: '2px dashed #e5e7eb',
                borderRadius: 16,
                color: '#6b7280',
              }}
            >
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                No recurring bills found
              </div>
              <p style={{ margin: 0 }}>
                {searchQuery || filterCategory || filterFrequency
                  ? 'Try adjusting the current filters.'
                  : 'Create your first recurring bill to automate future billing cycles.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '980px' }}>
                <thead>
                  <tr>
                    <th>Bill</th>
                    <th>Category</th>
                    <th>Cadence</th>
                    <th>Start Date</th>
                    <th>Next Run</th>
                    <th>Last Generated</th>
                    <th>Monthly Equivalent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => {
                    const categoryLabel =
                      CATEGORIES.find((category) => category.value === bill.category)?.label ||
                      bill.category
                    const scheduleStatus = getScheduleStatus(bill)
                    const nextRunDate = getNextRunDate(bill)

                    return (
                      <tr key={bill.id}>
                        <td>
                          <div style={{ display: 'grid', gap: 4 }}>
                            <span style={{ fontWeight: 700 }}>{bill.name}</span>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{bill.provider}</span>
                          </div>
                        </td>
                        <td>{categoryLabel}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: bill.frequency === 'monthly' ? '#dbeafe' : '#ede9fe',
                              color: bill.frequency === 'monthly' ? '#1d4ed8' : '#6d28d9',
                            }}
                          >
                            {bill.frequency === 'monthly' ? 'Monthly' : 'Quarterly'}
                          </span>
                        </td>
                        <td>{formatDate(bill.startDate)}</td>
                        <td>
                          <div style={{ display: 'grid', gap: 6 }}>
                            <span style={{ fontWeight: 600 }}>{formatDate(nextRunDate)}</span>
                            <span className="badge" style={scheduleStatus.style}>
                              {scheduleStatus.label}
                            </span>
                          </div>
                        </td>
                        <td>{formatDate(bill.lastGenerated)}</td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(getMonthlyEquivalent(bill))}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(bill)}
                              style={{
                                padding: '6px 10px',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(bill.id)}
                              disabled={deletingId === bill.id}
                              style={{
                                padding: '6px 10px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              {deletingId === bill.id ? 'Deleting...' : 'Delete'}
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

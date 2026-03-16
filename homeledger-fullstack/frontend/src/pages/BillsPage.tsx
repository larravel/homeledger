import { useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';

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

const initialForm = {
  name: '',
  provider: '',
  amount: '',
  dueDate: '',
  category: 'utility',
  isRecurring: false,
  frequency: 'monthly',
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState(initialForm);

  async function fetchBills() {
    try {
      const res = await api.get('/bills');
      setBills(res.data);
    } catch (error) {
      console.error('FETCH BILLS ERROR:', error);
      alert('Failed to load bills');
    }
  }

  useEffect(() => {
    fetchBills();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        provider: form.provider,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        category: form.category,
        isRecurring: form.isRecurring,
        frequency: form.isRecurring ? form.frequency : undefined,
      };

      if (editingId) {
        await api.patch(`/bills/${editingId}`, payload);
        alert('Bill updated successfully');
      } else {
        await api.post('/bills', payload);
        alert('Bill added successfully');
      }

      setForm(initialForm);
      setEditingId(null);
      await fetchBills();
    } catch (error: any) {
      console.error('SAVE BILL ERROR:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save bill';
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(bill: Bill) {
    setEditingId(bill.id);
    setForm({
      name: bill.name,
      provider: bill.provider,
      amount: String(bill.amount),
      dueDate: bill.dueDate,
      category: bill.category,
      isRecurring: bill.isRecurring,
      frequency: bill.frequency ?? 'monthly',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Delete this bill?');
    if (!confirmed) return;

    try {
      await api.delete(`/bills/${id}`);
      alert('Bill deleted successfully');

      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }

      await fetchBills();
    } catch (error) {
      console.error('DELETE BILL ERROR:', error);
      alert('Failed to delete bill');
    }
  }

  async function handlePay(bill: Bill) {
    const paymentDate = window.prompt('Enter payment date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!paymentDate) return;

    try {
      await api.post(`/payments/bill/${bill.id}`, {
        paymentDate,
      });

      alert('Payment recorded successfully');
      await fetchBills();
    } catch (error: any) {
      console.error('PAY BILL ERROR:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to pay bill';
      alert(message);
    }
  }

  return (
    <AppLayout title="Bills">
      <div className="content-grid bills-layout">
        <section className="panel">
          <h2>{editingId ? 'Edit Bill' : 'Add Bill'}</h2>

          <form className="bill-form" onSubmit={handleSubmit}>
            <input
              className="input"
              placeholder="Bill name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="input"
              placeholder="Provider"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
            />

            <input
              className="input"
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <input
              className="input"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />

            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="utility">Utility</option>
              <option value="rent">Rent</option>
              <option value="subscription">Subscription</option>
              <option value="loan">Loan</option>
              <option value="insurance">Insurance</option>
            </select>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              />
              <span>Recurring Bill</span>
            </label>

            {form.isRecurring && (
              <select
                className="input"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Bill' : 'Save Bill'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>My Bills</h2>

          {bills.length === 0 ? (
            <p>No bills yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill</th>
                    <th>Provider</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td>{bill.name}</td>
                      <td>{bill.provider}</td>
                      <td>₱{bill.amount}</td>
                      <td>{bill.dueDate}</td>
                      <td>{bill.status}</td>
                      <td>{bill.category}</td>
                      <td>
  <div className="action-row">
    <button
      className="icon-btn edit-btn"
      type="button"
      onClick={() => startEdit(bill)}
      title="Edit"
    >
      ✏️
    </button>

    <button
      className="icon-btn delete-btn"
      type="button"
      onClick={() => handleDelete(bill.id)}
      title="Delete"
    >
      🗑️
    </button>

    {bill.status !== 'paid' && (
      <button
        className="icon-btn pay-btn"
        type="button"
        onClick={() => handlePay(bill)}
        title="Mark Paid"
      >
        ✅
      </button>
    )}
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
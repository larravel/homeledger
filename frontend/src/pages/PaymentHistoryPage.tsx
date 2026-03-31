import { useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';

interface Payment {
  id: number;
  paymentDate: string;
  amountPaid: number;
  lateFee: number;
  bill?: {
    name: string;
    provider: string;
  };
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await api.get('/payments');
        setPayments(res.data);
      } catch (error) {
        console.error('PAYMENTS ERROR:', error);
      }
    }

    fetchPayments();
  }, []);

  return (
    <AppLayout title="Payment History">
      <section className="panel">
        <h2>Payments</h2>

        {payments.length === 0 ? (
          <p>No payments yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Provider</th>
                  <th>Payment Date</th>
                  <th>Late Fee</th>
                  <th>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.bill?.name || '-'}</td>
                    <td>{payment.bill?.provider || '-'}</td>
                    <td>{payment.paymentDate}</td>
                    <td>₱{payment.lateFee}</td>
                    <td>₱{payment.amountPaid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
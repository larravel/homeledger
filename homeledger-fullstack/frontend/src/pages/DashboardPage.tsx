import { useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';

interface CategoryBreakdownItem {
  category: string;
  total: number;
}

interface DashboardData {
  totalBillsThisMonth: number;
  totalPaid: number;
  totalUnpaid: number;
  upcomingDueTotal: number;
  overdueCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
}

interface Bill {
  id: number;
  name: string;
  provider: string;
  amount: number;
  dueDate: string;
  status: string;
  category: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [upcoming, setUpcoming] = useState<Bill[]>([]);
  const [overdue, setOverdue] = useState<Bill[]>([]);

  useEffect(() => {
    async function loadPage() {
      try {
        const [dashboardRes, billsRes, upcomingRes, overdueRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/bills'),
          api.get('/reports/upcoming'),
          api.get('/reports/overdue'),
        ]);

        setData(dashboardRes.data);
        setBills(billsRes.data);
        setUpcoming(upcomingRes.data);
        setOverdue(overdueRes.data);
      } catch (error) {
        console.error('DASHBOARD ERROR:', error);
      }
    }

    loadPage();
  }, []);

  return (
    <AppLayout title="Dashboard">
      <div className="cards-grid">
        <StatCard
          title="Total Bills"
          value={data ? `₱${data.totalBillsThisMonth}` : 'Loading...'}
        />
        <StatCard
          title="Paid"
          value={data ? `₱${data.totalPaid}` : 'Loading...'}
        />
        <StatCard
          title="Unpaid"
          value={data ? `₱${data.totalUnpaid}` : 'Loading...'}
        />
        <StatCard
          title="Upcoming Due"
          value={data ? `₱${data.upcomingDueTotal}` : 'Loading...'}
        />
      </div>

      <div className="content-grid" style={{ marginTop: '24px' }}>
        <section className="panel">
          <h2>Recent Bills</h2>

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
                  </tr>
                </thead>
                <tbody>
                  {bills.slice(0, 5).map((bill) => (
                    <tr key={bill.id}>
                      <td>{bill.name}</td>
                      <td>{bill.provider}</td>
                      <td>₱{bill.amount}</td>
                      <td>{bill.dueDate}</td>
                      <td>{bill.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Alerts</h2>

          <div className="summary-box">
            <p><strong>Upcoming Bills</strong></p>
            {upcoming.length === 0 ? (
              <p>No upcoming bills.</p>
            ) : (
              <ul className="simple-list">
                {upcoming.slice(0, 4).map((bill) => (
                  <li key={bill.id}>
                    <span>{bill.name}</span>
                    <strong>{bill.dueDate}</strong>
                  </li>
                ))}
              </ul>
            )}

            <p style={{ marginTop: 20 }}><strong>Overdue Bills</strong></p>
            {overdue.length === 0 ? (
              <p>No overdue bills.</p>
            ) : (
              <ul className="simple-list">
                {overdue.slice(0, 4).map((bill) => (
                  <li key={bill.id}>
                    <span>{bill.name}</span>
                    <strong>{bill.dueDate}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
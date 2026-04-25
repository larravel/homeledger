import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BillsPage from './pages/BillsPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import ProfilePage from './pages/ProfilePage';
import ExpensesPage from './pages/ExpensesPage'; // ✅ ADD THIS
import RecurringBillsPage from './pages/RecurringBillsPage'; // ✅ ADD THIS
import BudgetingPage from './pages/Budgeting'; // ✅ ADD THIS

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bills"
        element={
          <ProtectedRoute>
            <BillsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <PaymentHistoryPage />
          </ProtectedRoute>
        }
      />

      {/* ✅ NEW ROUTE */}
      <Route
        path="/recurring-bills"
        element={
          <ProtectedRoute>
            <RecurringBillsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* ✅ NEW ROUTE */}
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        }
      />

      {/* ✅ NEW ROUTE */}
      <Route
        path="/budgeting"
        element={
          <ProtectedRoute>
            <BudgetingPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

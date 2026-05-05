import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarSync,
  ChartColumnIncreasing,
  HandCoins,
  Home,
  Menu,
  Receipt,
  Settings2,
  Wallet,
} from 'lucide-react';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <button
          className="toggle-btn"
          onClick={() => setCollapsed((value) => !value)}
          aria-label="Toggle sidebar"
          type="button"
        >
          <Menu size={18} />
        </button>

        {!collapsed && (
          <div className="brand-copy">
            <div className="brand-title">HomeLedger</div>
            <div className="brand-subtitle">
              Household Billing & Expense Manager
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <Home size={18} />
          {!collapsed && 'Dashboard'}
        </NavLink>

        <NavLink
          to="/bills"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <Receipt size={18} />
          {!collapsed && 'Bills'}
        </NavLink>

        <NavLink
          to="/payments"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <Wallet size={18} />
          {!collapsed && 'Payment History'}
        </NavLink>

        <NavLink
          to="/recurring-bills"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <CalendarSync size={18} />
          {!collapsed && 'Recurring Bills'}
        </NavLink>

        <NavLink
          to="/expenses"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <HandCoins size={18} />
          {!collapsed && 'Expenses'}
        </NavLink>

        <NavLink
          to="/budgeting"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <ChartColumnIncreasing size={18} />
          {!collapsed && 'Budgeting'}
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <Settings2 size={18} />
          {!collapsed && 'Settings'}
        </NavLink>
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <span>HomeLedger</span>
          <small>Personal finance workspace</small>
        </div>
      )}
    </aside>
  );
}

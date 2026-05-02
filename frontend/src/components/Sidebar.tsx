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

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '15px',
    textDecoration: 'none',
    color: 'rgba(255,255,255,0.92)',
    background: isActive
      ? 'linear-gradient(90deg, rgba(18,34,77,1), rgba(32,73,164,0.96))'
      : 'transparent',
    fontWeight: 600,
    fontSize: '0.92rem',
    boxShadow: isActive ? '0 16px 30px rgba(8, 18, 44, 0.42)' : 'none',
  });

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
        <NavLink to="/dashboard" style={linkStyle}>
          <Home size={18} />
          {!collapsed && 'Dashboard'}
        </NavLink>

        <NavLink to="/bills" style={linkStyle}>
          <Receipt size={18} />
          {!collapsed && 'Bills'}
        </NavLink>

        <NavLink to="/payments" style={linkStyle}>
          <Wallet size={18} />
          {!collapsed && 'Payment History'}
        </NavLink>

        <NavLink to="/recurring-bills" style={linkStyle}>
          <CalendarSync size={18} />
          {!collapsed && 'Recurring Bills'}
        </NavLink>

        <NavLink to="/expenses" style={linkStyle}>
          <HandCoins size={18} />
          {!collapsed && 'Expenses'}
        </NavLink>

        <NavLink to="/budgeting" style={linkStyle}>
          <ChartColumnIncreasing size={18} />
          {!collapsed && 'Budgeting'}
        </NavLink>

        <NavLink to="/settings" style={linkStyle}>
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

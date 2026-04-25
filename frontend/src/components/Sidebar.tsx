import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'white',
    background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
    fontWeight: 500,
  });

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      {/* 🔥 BRAND / TOGGLE */}
      <div className="brand">
        <button
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          ☰
        </button>

        {!collapsed && (
          <div>
            <div className="brand-title">HomeLedger</div>
            <div className="brand-subtitle">
              Household Billing & Expense Manager
            </div>
          </div>
        )}
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" style={linkStyle}>
          📊 {!collapsed && 'Dashboard'}
        </NavLink>

        <NavLink to="/bills" style={linkStyle}>
          🧾 {!collapsed && 'Bills'}
        </NavLink>

        <NavLink to="/payments" style={linkStyle}>
          💳 {!collapsed && 'Payments'}
        </NavLink>

        <NavLink to="/budgeting" style={linkStyle}>
          ?? {!collapsed && 'Budgeting'}
        </NavLink>

        <NavLink to="/utility-usage" style={linkStyle}>
          ⚡ {!collapsed && 'Utilities'}
        </NavLink>

        <NavLink to="/settings" style={linkStyle}>
          ⚙️ {!collapsed && 'Settings'}
        </NavLink>
      </nav>

      {/* LOGOUT */}
      <button className="logout-btn" onClick={handleLogout}>
        {!collapsed ? 'Logout' : '🚪'}
      </button>
    </aside>
  );
}
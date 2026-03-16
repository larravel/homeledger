import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'block',
    padding: '12px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'white',
    background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
    fontWeight: 500,
  });

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">H</div>
        <div>
          <div className="brand-title">HomeLedger</div>
          <div className="brand-subtitle">Billing Manager</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" style={linkStyle}>
          Dashboard
        </NavLink>

        <NavLink to="/bills" style={linkStyle}>
          Bills
        </NavLink>

        <NavLink to="/payments" style={linkStyle}>
          Payment History
        </NavLink>
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}
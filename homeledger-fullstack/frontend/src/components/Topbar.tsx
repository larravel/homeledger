export default function Topbar({ title }: { title: string }) {
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <header className="topbar">
      <div>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="topbar-user">
        <div className="user-badge">
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="user-email">{user?.email || 'User'}</div>
      </div>
    </header>
  );
}
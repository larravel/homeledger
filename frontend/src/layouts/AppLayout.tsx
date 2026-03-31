import type { ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

interface AppLayoutProps {
  title: string;
  children: ReactNode;
}

export default function AppLayout({ title, children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <Topbar title={title} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
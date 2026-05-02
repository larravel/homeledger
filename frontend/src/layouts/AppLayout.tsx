import { useEffect, useState, type ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import {
  applyThemePreference,
  getStoredPreferences,
  PREFERENCES_EVENT,
} from '../utils/preferences';

interface AppLayoutProps {
  title?: string;
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [, setPreferencesVersion] = useState(0);

  useEffect(() => {
    const syncPreferences = () => {
      applyThemePreference(getStoredPreferences().theme);
      setPreferencesVersion((current) => current + 1);
    };

    syncPreferences();

    window.addEventListener(PREFERENCES_EVENT, syncPreferences as EventListener);
    window.addEventListener('storage', syncPreferences);

    return () => {
      window.removeEventListener(PREFERENCES_EVENT, syncPreferences as EventListener);
      window.removeEventListener('storage', syncPreferences);
    };
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, CreditCard, MoonStar, UserRound } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import api from '../services/api';
import '../styles/settings-page.css';
import {
  applyThemePreference,
  DEFAULT_PREFERENCES,
  getStoredPreferences,
  saveStoredPreferences,
  type AppPreferences,
} from '../utils/preferences';
import { fetchUserSettings, saveUserPreferences } from '../utils/settings';

interface ProfileData {
  id: number;
  name: string;
  email: string;
}

interface NoticeState {
  type: 'success' | 'error';
  message: string;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    id: 0,
    name: '',
    email: '',
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setPreferences(getStoredPreferences());

    async function fetchProfile() {
      setLoading(true);
      try {
        const response = await api.get('/auth/profile');
        const data = response.data;
        const nextProfile = {
          id: Number(data?.id || 0),
          name: data?.name || '',
          email: data?.email || '',
        };

        setProfile(nextProfile);
        setProfileForm({
          name: nextProfile.name,
          email: nextProfile.email,
        });

        try {
          const settings = await fetchUserSettings();
          setPreferences(settings.preferences);
          applyThemePreference(settings.preferences.theme);
        } catch (settingsError) {
          console.error('Fetch settings error:', settingsError);
          const cachedPreferences = getStoredPreferences();
          setPreferences(cachedPreferences);
          applyThemePreference(cachedPreferences.theme);
        }
      } catch (error) {
        console.error('Fetch profile error:', error);
        setNotice({
          type: 'error',
          message: 'Could not load your account details.',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  function handleProfileChange(event: ChangeEvent<HTMLInputElement>) {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPasswordForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function handlePreferenceChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const target = event.target;
    const { name, value } = target;
    const isCheckbox = target instanceof HTMLInputElement && target.type === 'checkbox';
    setPreferences((current) => ({
      ...current,
      [name]: isCheckbox
        ? target.checked
        : name === 'decimalPlaces'
          ? Number(value)
          : value,
    }));
  }

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      setNotice({ type: 'error', message: 'Full name is required.' });
      return;
    }

    setSavingProfile(true);
    setNotice(null);

    try {
      const response = await api.patch('/auth/profile', {
        name: profileForm.name.trim(),
      });

      const updated = {
        id: Number(response.data?.user?.id || profile.id),
        name: response.data?.user?.name || profileForm.name.trim(),
        email: response.data?.user?.email || profile.email,
      };

      setProfile(updated);
      setProfileForm({
        name: updated.name,
        email: updated.email,
      });

      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : {};
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...parsedUser,
          id: updated.id,
          name: updated.name,
          email: updated.email,
        }),
      );

      setNotice({ type: 'success', message: 'Account information updated.' });
    } catch (error: any) {
      console.error('Save profile error:', error);
      setNotice({
        type: 'error',
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Could not save your account details.',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setNotice({ type: 'error', message: 'Complete all password fields first.' });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setNotice({ type: 'error', message: 'New password confirmation does not match.' });
      return;
    }
    if (passwordForm.next.length < 6) {
      setNotice({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (passwordForm.current === passwordForm.next) {
      setNotice({
        type: 'error',
        message: 'Choose a new password that is different from the current one.',
      });
      return;
    }

    setChangingPassword(true);
    setNotice(null);

    try {
      await api.post('/auth/change-password', {
        current: passwordForm.current,
        new: passwordForm.next,
      });

      setPasswordForm({
        current: '',
        next: '',
        confirm: '',
      });

      setNotice({ type: 'success', message: 'Password updated successfully.' });
    } catch (error: any) {
      console.error('Change password error:', error);
      setNotice({
        type: 'error',
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Could not change your password.',
      });
    } finally {
      setChangingPassword(false);
    }
  }

  async function handlePreferencesSave() {
    setSavingPreferences(true);
    setNotice(null);

    const nextPreferences = {
      ...preferences,
      notifications: true,
      emailNotifications: true,
      billReminders: true,
      expenseAlerts: true,
    };

    setPreferences(nextPreferences);
    saveStoredPreferences(nextPreferences);
    applyThemePreference(nextPreferences.theme);

    try {
      const savedPreferences = await saveUserPreferences(nextPreferences);
      setPreferences(savedPreferences);
      applyThemePreference(savedPreferences.theme);
      setNotice({ type: 'success', message: 'Preferences saved.' });
    } catch (error: any) {
      console.error('Save preferences error:', error);
      setNotice({
        type: 'success',
        message:
          'Preferences applied on this device. Restart the backend to sync them to the database.',
      });
    } finally {
      setSavingPreferences(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Delete your account permanently? This will remove your bills, payments, expenses, recurring bills, and access to this account.',
    );

    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    setNotice(null);

    try {
      await api.delete('/auth/profile');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/register');
    } catch (error: any) {
      console.error('Delete account error:', error);
      setNotice({
        type: 'error',
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Could not delete your account.',
      });
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <AppLayout>
      <div className="dashboard-screen">
        <div className="dashboard-screen-header">
          <div>
            <h1>Settings</h1>
            <p>Manage your account, preferences, and security settings.</p>
          </div>
        </div>

        {notice ? (
          <div className={`alert ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {notice.message}
          </div>
        ) : null}

        <div className="dashboard-card-grid">
          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <UserRound size={18} />
              </div>
              <div className="dashboard-stat-title">Account Name</div>
            </div>
            <div className="dashboard-stat-value settings-stat-text">
              {profile.name || 'Loading...'}
            </div>
          </div>

          <div className="dashboard-stat-box green">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <CreditCard size={18} />
              </div>
              <div className="dashboard-stat-title">Currency</div>
            </div>
            <div className="dashboard-stat-value settings-stat-text">
              {preferences.currency}
            </div>
          </div>

          <div className="dashboard-stat-box gold">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <MoonStar size={18} />
              </div>
              <div className="dashboard-stat-title">Theme</div>
            </div>
            <div className="dashboard-stat-value settings-stat-text">
              {preferences.theme}
            </div>
          </div>

          <div className="dashboard-stat-box blue">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon-wrap">
                <BellRing size={18} />
              </div>
              <div className="dashboard-stat-title">Alerts</div>
            </div>
            <div className="dashboard-stat-value settings-stat-text">Enabled</div>
          </div>
        </div>

        <div className="settings-shell">
          <div className="settings-dashboard-grid">
            <section className="dashboard-panel settings-panel settings-panel--account">
              <div className="dashboard-panel-headline">
                <div>
                  <h2>Account Information</h2>
                  <p className="bills-panel-copy">
                    Update your name and review your login email.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="settings-form-grid">
                <label className="bills-field">
                  <span>Full Name</span>
                  <input
                    className="input"
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    disabled={loading}
                  />
                </label>

                <label className="bills-field">
                  <span>Email</span>
                  <input
                    className="input"
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    disabled
                  />
                </label>

                <div className="settings-help-inline">Email cannot be changed from this page.</div>

                <div className="settings-inline-actions">
                  <button
                    className="primary-btn settings-submit-btn"
                    type="submit"
                    disabled={savingProfile || loading}
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </section>

            <section className="dashboard-panel settings-panel settings-panel--preferences">
              <div className="dashboard-panel-headline">
                <div>
                  <h2>Preferences</h2>
                  <p className="bills-panel-copy">
                    Control currency, date format, and theme behavior.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-preferences-fields">
                  <label className="bills-field">
                    <span>Currency</span>
                    <select
                      className="input"
                      name="currency"
                      value={preferences.currency}
                      onChange={handlePreferenceChange}
                    >
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </label>

                  <label className="bills-field">
                    <span>Decimal Places</span>
                    <select
                      className="input"
                      name="decimalPlaces"
                      value={preferences.decimalPlaces}
                      onChange={handlePreferenceChange}
                    >
                      <option value={0}>0</option>
                      <option value={2}>2</option>
                    </select>
                  </label>

                  <label className="bills-field">
                    <span>Date Format</span>
                    <select
                      className="input"
                      name="dateFormat"
                      value={preferences.dateFormat}
                      onChange={handlePreferenceChange}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </label>

                  <label className="bills-field">
                    <span>Theme</span>
                    <select
                      className="input"
                      name="theme"
                      value={preferences.theme}
                      onChange={handlePreferenceChange}
                    >
                      <option value="light">light</option>
                      <option value="dark">dark</option>
                      <option value="auto">auto</option>
                    </select>
                  </label>
                </div>

                <div className="settings-inline-actions">
                  <button
                    className="primary-btn settings-submit-btn"
                    type="button"
                    onClick={handlePreferencesSave}
                    disabled={savingPreferences}
                  >
                    {savingPreferences ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </section>

            <section className="dashboard-panel settings-panel settings-panel--security">
              <div className="dashboard-panel-headline">
                <div>
                  <h2>Security</h2>
                  <p className="bills-panel-copy">Change your password from inside the app.</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="settings-form-grid">
                <label className="bills-field">
                  <span>Current Password</span>
                  <input
                    className="input"
                    type="password"
                    name="current"
                    value={passwordForm.current}
                    onChange={handlePasswordChange}
                  />
                </label>

                <label className="bills-field">
                  <span>New Password</span>
                  <input
                    className="input"
                    type="password"
                    name="next"
                    value={passwordForm.next}
                    onChange={handlePasswordChange}
                  />
                </label>

                <label className="bills-field">
                  <span>Confirm New Password</span>
                  <input
                    className="input"
                    type="password"
                    name="confirm"
                    value={passwordForm.confirm}
                    onChange={handlePasswordChange}
                  />
                </label>

                <div className="settings-help-inline">Minimum 6 characters.</div>

                <div className="settings-inline-actions">
                  <button
                    className="primary-btn settings-submit-btn"
                    type="submit"
                    disabled={changingPassword}
                  >
                    {changingPassword ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </section>

            <section className="dashboard-panel settings-panel settings-panel--actions">
              <div className="dashboard-panel-headline">
                <div>
                  <h2>Account Actions</h2>
                  <p className="bills-panel-copy">
                    Securely leave this device or permanently close your account.
                  </p>
                </div>
              </div>

              <div className="settings-account-actions">
                <div className="settings-action-card">
                  <div className="settings-action-copy">
                    <strong>Logout</strong>
                    <small>Sign out from this account on this device.</small>
                  </div>
                  <button
                    className="secondary-btn settings-secondary-action"
                    type="button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
                <div className="settings-action-card settings-action-card--danger">
                  <div className="settings-action-copy">
                    <strong>Delete Account</strong>
                    <small>Permanently remove this account and its saved data.</small>
                  </div>
                  <button
                    className="danger-btn settings-danger-btn"
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                  >
                    {deletingAccount ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

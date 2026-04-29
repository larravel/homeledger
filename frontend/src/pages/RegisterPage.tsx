import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import api from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/register', { name, email, password });
      alert('Registration successful');
      navigate('/login');
    } catch (error: any) {
      console.error('REGISTER ERROR:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Registration failed';
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="auth-badge">HomeLedger</div>
          <h1>Build a cleaner way to manage your household bills.</h1>
          <p>
            Create your workspace to organize monthly budgets, recurring bills,
            payment history, and day-to-day household expenses.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                <ShieldCheck size={16} />
              </span>
              <div>
                <strong>One connected billing system</strong>
                <small>Bills, expenses, payment history, and budgeting stay in sync.</small>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                <ArrowRight size={16} />
              </span>
              <div>
                <strong>Simple monthly control</strong>
                <small>Know what is due, what is spent, and what is still available this month.</small>
              </div>
            </div>
          </div>
        </section>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card-head">
            <span className="auth-kicker">Create Account</span>
            <h2>Register for HomeLedger</h2>
            <p>Set up your account to start managing your household billing system.</p>
          </div>

          <label className="auth-field">
            <span>Full Name</span>
            <div className="auth-input-wrap">
              <UserRound size={16} />
              <input
                className="input"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Email</span>
            <div className="auth-input-wrap">
              <Mail size={16} />
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-wrap">
              <LockKeyhole size={16} />
              <input
                className="input"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </label>

          <button className="primary-btn auth-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Create Account'}
          </button>

          <p className="auth-text">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

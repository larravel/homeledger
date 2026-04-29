import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });

      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      alert('Login successful');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('LOGIN ERROR:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed';
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
          <h1>Welcome back to your household billing workspace.</h1>
          <p>
            Stay on top of due dates, monthly budgets, expenses, and recurring
            household payments in one clean system.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                <ShieldCheck size={16} />
              </span>
              <div>
                <strong>Secure household records</strong>
                <small>Your bills, budgets, and payment activity stay private to your account.</small>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                <ArrowRight size={16} />
              </span>
              <div>
                <strong>Quick monthly overview</strong>
                <small>Jump straight into dashboards, due bills, and recent payment activity.</small>
              </div>
            </div>
          </div>
        </section>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card-head">
            <span className="auth-kicker">Sign In</span>
            <h2>Login to HomeLedger</h2>
            <p>Enter your account details to continue managing your household finances.</p>
          </div>

          <label className="auth-field">
            <span>Email</span>
            <div className="auth-input-wrap">
              <Mail size={16} />
              <input
                className="input"
                type="email"
                placeholder="Enter your account email"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </label>

          <button className="primary-btn auth-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Signing you in...' : 'Enter HomeLedger'}
          </button>

          <p className="auth-note">
            Use the account you created for your household billing workspace.
          </p>

          <p className="auth-text">
            New to HomeLedger? <Link to="/register">Create your account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

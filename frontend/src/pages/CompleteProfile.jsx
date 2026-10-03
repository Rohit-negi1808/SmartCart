import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Auth.css';

// Step 3 of 3: name + password. Only reachable with a valid, short-lived
// registrationToken handed over by VerifyEmail.jsx after OTP success -
// this is the step where the account actually becomes usable.
const CompleteProfile = () => {
  const { completeRegistration } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;
  const registrationToken = location.state?.registrationToken;

  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // No verification session means someone landed here directly (or it
  // expired) - send them back to start over rather than show a dead form.
  useEffect(() => {
    if (!email || !registrationToken) navigate('/register', { replace: true });
  }, [email, registrationToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await completeRegistration(registrationToken, form.name, form.password, form.confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.friendlyMessage || 'Could not finish creating your account');
    } finally {
      setLoading(false);
    }
  };

  if (!email || !registrationToken) return null;

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Almost done</h1>
        <p className="auth-sub">
          <strong style={{ color: 'var(--text)' }}>{email}</strong> is verified. Set a name and
          password to finish creating your account.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input type="text" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input type="password" required minLength={6} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;

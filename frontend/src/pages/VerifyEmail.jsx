import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Auth.css';

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // No email in state means someone landed here directly - send them
  // back to register rather than showing a broken form.
  useEffect(() => {
    if (!email) navigate('/register', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await verifyOtp(email, otp.trim());
      if (result.registrationToken) {
        // Normal case: email verified, account not created yet - go set
        // name + password. The registrationToken proves verification;
        // nothing is stored in localStorage until step 3 succeeds.
        navigate('/complete-profile', { state: { email: result.email, registrationToken: result.registrationToken } });
      } else {
        // Rare edge case: this email already had a complete account and
        // verifyOtp logged them straight in - no completion step needed.
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      await resendOtp(email);
      setInfo('A new code has been sent to your email.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.friendlyMessage || 'Could not resend the code');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Verify your email</h1>
        <p className="auth-sub">
          We sent a 6-digit code to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
          Enter it below to verify your email - you'll set your name and password next.
        </p>
        {error && <div className="error-banner">{error}</div>}
        {info && (
          <div style={{ background: 'rgba(87,199,133,0.1)', border: '1px solid rgba(87,199,133,0.3)', color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: 16 }}>
            {info}
          </div>
        )}
        <form onSubmit={handleVerify}>
          <div className="field">
            <label>6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{ letterSpacing: '6px', fontSize: '1.2rem', textAlign: 'center' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div className="auth-switch">
          Didn't get a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            style={{ background: 'none', border: 'none', color: cooldown > 0 ? 'var(--text-faint)' : 'var(--link)', cursor: cooldown > 0 ? 'default' : 'pointer', textDecoration: cooldown > 0 ? 'none' : 'underline', padding: 0, font: 'inherit' }}
          >
            {resending ? 'Sending...' : cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
          </button>
        </div>
        <div className="auth-switch">
          <Link to="/login">Back to log in</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

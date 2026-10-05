import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Auth.css';

// Step 1 of 3: email only. Name and password are collected later in
// CompleteProfile.jsx, AFTER the email is verified - see VerifyEmail.jsx.
const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setShowDemoNotice(false);
    setLoading(true);

    try {
      const { email: confirmedEmail } = await register(email);

      navigate('/verify-email', {
        state: { email: confirmedEmail },
      });
    } catch (err) {
      const message = err.friendlyMessage || '';

      // On the live production deployment, the existing backend returns
      // this message when the OTP email cannot be delivered.
      // Show the professional demo notice instead of a raw server error.
      if (
        import.meta.env.PROD &&
        message.includes('Could not send the verification email')
      ) {
        setShowDemoNotice(true);
      } else {
        // Keep normal error handling unchanged for every other error.
        setError(err.friendlyMessage || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Create your account</h1>

        <p className="auth-sub">
          Enter your email and we'll send you a 6-digit code first - you'll
          set your name and password after it's verified, so no account is
          created until we know the address is real.
        </p>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>

            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !email.trim()}
          >
            {loading ? 'Sending verification code...' : 'Send OTP'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </div>
      </div>

      {/* Live deployment email-delivery notice */}
      {showDemoNotice && (
        <div
          className="demo-notice-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDemoNotice(false);
            }
          }}
        >
          <div className="demo-notice-modal">
            <button
              type="button"
              className="demo-notice-close"
              onClick={() => setShowDemoNotice(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="demo-notice-badge">
              LIVE DEMO NOTICE
            </div>

            <h2>Email verification unavailable</h2>

            <p>
              SmartCart uses email-based OTP verification for account
              security. In this live demo, the current free-tier hosting
              environment restricts outbound SMTP email delivery, so a
              verification code cannot be delivered from the deployed
              application.
            </p>

            <p>
              The complete email OTP authentication system is implemented
              and works in the local development environment. Live email
              verification requires SMTP-enabled or paid hosting, or an
              email delivery API.
            </p>

            <div className="demo-notice-features">
              <strong>You can still explore SmartCart:</strong>

              <span>
                ✓ Laptop browsing and search
              </span>

              <span>
                ✓ Filters and product comparison
              </span>

              <span>
                ✓ Laptop recommendations
              </span>

              <span>
                ✓ AI shopping assistant
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block demo-notice-button"
              onClick={() => setShowDemoNotice(false)}
            >
              Continue exploring SmartCart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
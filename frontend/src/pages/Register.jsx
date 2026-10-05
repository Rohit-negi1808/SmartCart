import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Auth.css';

// Step 1 of 3: email only. Name and password are collected later, in
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

    // Live deployment:
    // Show the information popup immediately instead of waiting for
    // the Render SMTP connection to time out.
    //
    // Local development:
    // Keep the existing registration/OTP flow completely unchanged.
    if (import.meta.env.PROD) {
      setShowDemoNotice(true);
      return;
    }

    setLoading(true);

    try {
      const { email: confirmedEmail } = await register(email);

      navigate('/verify-email', {
        state: { email: confirmedEmail },
      });
    } catch (err) {
      setError(
        err.friendlyMessage || 'Registration failed'
      );
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
            {loading
              ? 'Sending verification code...'
              : 'Send OTP'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </div>
      </div>

      {/* =====================================================
          LIVE DEMO INFORMATION POPUP
          ===================================================== */}
      {showDemoNotice && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDemoNotice(false);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-notice-title"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              border: '1px solid #343844',
              borderRadius: '14px',
              background: '#191c24',
              color: '#f5f7fa',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowDemoNotice(false)}
              aria-label="Close notice"
              style={{
                position: 'absolute',
                top: '14px',
                right: '16px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #343844',
                borderRadius: '8px',
                background: 'transparent',
                color: '#aeb4c2',
                fontSize: '24px',
                lineHeight: '1',
                cursor: 'pointer',
              }}
            >
              ×
            </button>

            {/* Badge */}
            <div
              style={{
                display: 'inline-block',
                marginBottom: '12px',
                padding: '5px 9px',
                borderRadius: '6px',
                background: 'rgba(242, 184, 75, 0.12)',
                border: '1px solid rgba(242, 184, 75, 0.28)',
                color: '#f2b84b',
                fontSize: '0.68rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
              }}
            >
              LIVE DEMO NOTICE
            </div>

            <h2
              id="demo-notice-title"
              style={{
                margin: '0 40px 16px 0',
                color: '#f5f7fa',
                fontSize: '1.35rem',
                lineHeight: '1.3',
              }}
            >
              Email verification unavailable
            </h2>

            <p
              style={{
                margin: '0 0 15px',
                color: '#aeb4c2',
                fontSize: '0.9rem',
                lineHeight: '1.65',
              }}
            >
              SmartCart uses email-based OTP verification for account
              security. In this live demo, the current free-tier hosting
              environment restricts outbound SMTP email delivery, so a
              verification code cannot be delivered from the deployed
              application.
            </p>

            <p
              style={{
                margin: '0 0 20px',
                color: '#aeb4c2',
                fontSize: '0.9rem',
                lineHeight: '1.65',
              }}
            >
              The complete email OTP authentication system is implemented
              and works in the local development environment. Live email
              verification requires SMTP-enabled or paid hosting, or an
              email delivery service.
            </p>

            {/* Features that remain available */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '9px',
                margin: '22px 0',
                padding: '16px',
                border: '1px solid #343844',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.025)',
              }}
            >
              <strong
                style={{
                  marginBottom: '2px',
                  color: '#f5f7fa',
                  fontSize: '0.86rem',
                }}
              >
                You can still explore SmartCart:
              </strong>

              <span
                style={{
                  color: '#aeb4c2',
                  fontSize: '0.84rem',
                }}
              >
                ✓ Laptop browsing and search
              </span>

              <span
                style={{
                  color: '#aeb4c2',
                  fontSize: '0.84rem',
                }}
              >
                ✓ Filters and product comparison
              </span>

              <span
                style={{
                  color: '#aeb4c2',
                  fontSize: '0.84rem',
                }}
              >
                ✓ Laptop recommendations
              </span>

              <span
                style={{
                  color: '#aeb4c2',
                  fontSize: '0.84rem',
                }}
              >
                ✓ AI shopping assistant
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block"
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
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { email: confirmedEmail } = await register(email);
      navigate('/verify-email', { state: { email: confirmedEmail } });
    } catch (err) {
      setError(err.friendlyMessage || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Create your account</h1>
        <p className="auth-sub">
          Enter your email and we'll send you a 6-digit code first - you'll set your name and
          password after it's verified, so no account is created until we know the address is real.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading || !email.trim()}>
            {loading ? 'Sending verification code...' : 'Send OTP'}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

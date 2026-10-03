import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, fetchMe, verifyOtpRequest, resendOtpRequest, completeRegistrationRequest } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('smartcart_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // On first load, verify any stored token is still valid.
  useEffect(() => {
    const token = localStorage.getItem('smartcart_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem('smartcart_user', JSON.stringify(res.data.data));
      })
      .catch(() => {
        localStorage.removeItem('smartcart_token');
        localStorage.removeItem('smartcart_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginUser({ email, password });
    const { token, user: userData } = res.data.data;
    localStorage.setItem('smartcart_token', token);
    localStorage.setItem('smartcart_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  // Step 1: email only. Does NOT create a usable account or log anyone
  // in - just sends an OTP. Returns { email } for the caller to move on
  // to the verification screen.
  const register = useCallback(async (email) => {
    const res = await registerUser(email);
    return res.data.data; // { email }
  }, []);

  // Step 2: OTP verification. Still does NOT log the user in - there's no
  // password yet, so there's nothing to "log in" to. Returns either
  // { registrationToken, email } (normal case - proceed to step 3) or,
  // in the rare edge case where the account somehow already had a
  // password, { token, user } (already-complete account, log straight in).
  const verifyOtp = useCallback(async (email, otp) => {
    const res = await verifyOtpRequest(email, otp);
    const data = res.data.data;
    if (data.token) {
      localStorage.setItem('smartcart_token', data.token);
      localStorage.setItem('smartcart_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  }, []);

  // Step 3: name + password, authorized by the registrationToken (proof
  // OTP was already verified) rather than any stored session. THIS is
  // the point the account actually becomes usable - a real login token
  // comes back and the user is now logged in.
  const completeRegistration = useCallback(async (registrationToken, name, password, confirmPassword) => {
    const res = await completeRegistrationRequest(registrationToken, { name, password, confirmPassword });
    const { token, user: userData } = res.data.data;
    localStorage.setItem('smartcart_token', token);
    localStorage.setItem('smartcart_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const resendOtp = useCallback(async (email) => {
    const res = await resendOtpRequest(email);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('smartcart_token');
    localStorage.removeItem('smartcart_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, completeRegistration, resendOtp, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

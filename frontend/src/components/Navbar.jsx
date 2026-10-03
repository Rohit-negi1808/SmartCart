import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHeart, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import './Navbar.css';

const links = [
  { to: '/ai-search', label: 'AI Search' },
  { to: '/products', label: 'Products' },
  { to: '/compare', label: 'Compare' },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          <span className="navbar-brand-mark">SC</span>
          SmartCart
        </Link>

        <nav className={`navbar-links ${open ? 'is-open' : ''}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `navbar-link ${isActive ? 'is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <div className="navbar-mobile-actions">
            {isAuthenticated ? (
              <>
                <Link to="/wishlist" onClick={() => setOpen(false)}>Wishlist</Link>
                <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                {user?.role === 'admin' && <Link to="/admin" onClick={() => setOpen(false)}>Admin</Link>}
                <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>Sign up</Link>
              </>
            )}
          </div>
        </nav>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to="/wishlist" className="icon-btn" title="Wishlist"><FiHeart /></Link>
              <Link to="/dashboard" className="icon-btn" title="Dashboard"><FiUser /></Link>
              {user?.role === 'admin' && <Link to="/admin" className="btn btn-ghost btn-sm">Admin</Link>}
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>

        <button className="navbar-toggle" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;

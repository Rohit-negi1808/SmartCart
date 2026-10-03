import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Lightweight client-side state for "products selected to compare".
// Kept separate from AuthContext since it's unrelated, unauthenticated
// state - not a reason to reach for Redux, just a small context.
const CompareContext = createContext(null);
const STORAGE_KEY = 'smartcart_compare';
const MAX_COMPARE = 4;

export const CompareProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const toggleCompare = useCallback((product) => {
    setItems((prev) => {
      const exists = prev.some((p) => p._id === product._id);
      if (exists) return prev.filter((p) => p._id !== product._id);
      if (prev.length >= MAX_COMPARE) return prev; // silently cap at MAX_COMPARE
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId) => {
    setItems((prev) => prev.filter((p) => p._id !== productId));
  }, []);

  const clearCompare = useCallback(() => setItems([]), []);

  const compareIds = items.map((p) => p._id);

  return (
    <CompareContext.Provider value={{ items, compareIds, toggleCompare, removeFromCompare, clearCompare, maxCompare: MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider');
  return ctx;
};

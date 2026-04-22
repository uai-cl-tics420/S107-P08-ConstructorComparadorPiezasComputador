/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState, createContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { App } from '@/views/App';
import { LogIn } from '@/views/LogIn';

export const ThemeContext = createContext({
  theme: 'dark',
  setTheme: (theme: string) => {},
});

function AnimatedRoutes() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <AnimatePresence mode='wait'>
        <Routes location={location} key={location.pathname}>
          <Route path='/' element={<App />} />
          <Route path='/login' element={<LogIn />} />
          <Route path='/account' element={<App />} /> {/*PLACEHOLDER*/}
        </Routes>
      </AnimatePresence>
    </ThemeContext.Provider>
  );
}

function start() {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}

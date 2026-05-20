/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import React, { useEffect, useState, createContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { App } from '@/views/App';
import { LogIn } from '@/views/LogIn';
import { UserConfig } from '@/views/UserConfig';

interface ConfigContextType {
  config: { theme: string; language: string };
  setConfig: React.Dispatch<React.SetStateAction<{ theme: string; language: string }>>;
}

export const ConfigContext = createContext<ConfigContextType>({
  config: { theme: 'dark', language: 'en' },
  setConfig: () => {},
});

function AnimatedRoutes() {
  const location = useLocation();
  const [config, setConfig] = useState(() => {
    const themeConfig =
      localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const languageConfig =
      ['en', 'es'].find((l) => l === (localStorage.getItem('language') || navigator.language.split('-')[0])) || 'en';
    return {
      theme: themeConfig,
      language: languageConfig,
    };
  });

  useEffect(() => {
    document.documentElement.lang = config.language;
    localStorage.setItem('language', config.language);
  }, [config.language]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme);
    localStorage.setItem('theme', config.theme);
  }, [config.theme]);

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      <AnimatePresence mode='wait'>
        <Routes location={location} key={location.pathname}>
          <Route path='/' element={<App />} />
          <Route path='/login' element={<LogIn />} />
          <Route path='/account' element={<UserConfig />} />
        </Routes>
      </AnimatePresence>
    </ConfigContext.Provider>
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

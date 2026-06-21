/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

// Bootstrap i18n before anything renders so all components have translations available
import '@/i18n';

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import React, { useEffect, useState, createContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { I18nextProvider } from 'react-i18next';
import { App } from '@/views/App';
import { LogIn } from '@/views/LogIn';
import { UserConfig } from '@/views/UserConfig';
import i18n from '@/i18n';
import { SUPPORTED_LANGUAGES } from '@/i18n';

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
  const [config, setConfig] = useState<{ theme: string; language: string }>(() => {
    const themeConfig =
      localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const languageConfig =
      SUPPORTED_LANGUAGES.find((l) => l === (localStorage.getItem('language') || navigator.language.split('-')[0])) ||
      'en';
    return { theme: themeConfig, language: languageConfig };
  });

  // Keep localStorage, html[lang], and i18next all in sync whenever language changes
  useEffect(() => {
    const lang = config.language;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    // Always call changeLanguage — i18next is a no-op if already on that language
    i18n.changeLanguage(lang);
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
          <Route path='/login/:view?' element={<LogIn />} />
          <Route path='/account' element={<UserConfig />} />
        </Routes>
      </AnimatePresence>
    </ConfigContext.Provider>
  );
}

function Root() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </I18nextProvider>
  );
}

function start() {
  const root = createRoot(document.getElementById('root')!);
  root.render(<Root />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}

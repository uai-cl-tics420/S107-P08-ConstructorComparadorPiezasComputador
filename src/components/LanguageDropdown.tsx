import { useState, useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ConfigContext } from '@/frontend';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import i18n from '@/i18n';

/**
 * Compact language switcher for the main navbar.
 * Calls i18n.changeLanguage first (triggers immediate re-render of all
 * useTranslation consumers), then syncs ConfigContext so the preference
 * is persisted to localStorage via the useEffect in frontend.tsx.
 */
export function LanguageDropdown() {
  const { t } = useTranslation();
  const { config, setConfig } = useContext(ConfigContext);
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = config.language as SupportedLanguage;

  const handleSelect = (lang: SupportedLanguage) => {
    if (lang === currentLang) {
      setIsOpen(false);
      return;
    }
    // Change i18n first so all useTranslation hooks re-render immediately
    i18n.changeLanguage(lang);
    // Then update config (triggers localStorage persistence in frontend.tsx)
    setConfig((prev) => ({ ...prev, language: lang }));
    setIsOpen(false);
  };

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 font-mono text-xs text-tw-muted hover:text-tw-primary border border-tw-border-deep/50 hover:border-tw-border bg-tw-surface/50 hover:bg-tw-surface px-2.5 py-2 rounded-lg transition-all cursor-pointer ${
          isOpen ? 'border-tw-border text-tw-primary' : ''
        }`}
        aria-label={t('common.close')}
        aria-expanded={isOpen}
        aria-haspopup='listbox'>
        <span className='uppercase tracking-widest'>{currentLang}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className='fixed inset-0 z-10' onClick={() => setIsOpen(false)} />
            <motion.ul
              role='listbox'
              aria-label='Language selection'
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className='absolute right-0 mt-2 w-40 bg-tw-surface/98 backdrop-blur-xl border border-tw-border rounded-xl shadow-2xl shadow-black/40 z-20 overflow-hidden py-1'>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <li
                  key={lang}
                  role='option'
                  aria-selected={lang === currentLang}
                  onClick={() => handleSelect(lang)}
                  className={`flex items-center justify-between px-4 py-2.5 font-mono text-xs cursor-pointer transition-colors hover:bg-tw-base-highlight/5 ${
                    lang === currentLang ? 'text-tw-accent' : 'text-tw-primary'
                  }`}>
                  <span>{t(`language.${lang}`)}</span>
                  {lang === currentLang && <span className='w-1.5 h-1.5 rounded-full bg-tw-accent' />}
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

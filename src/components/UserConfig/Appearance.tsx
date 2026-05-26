import { useState, useContext } from 'react';
import { Moon, Sun, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigContext } from '@/frontend';

export function Appearance() {
  const [isOpen, setIsOpen] = useState(false);
  const languages = [
    { id: 'es', label: 'Español (ES)' },
    { id: 'en', label: 'English (EN)' },
  ];

  const { config, setConfig } = useContext(ConfigContext);

  const currentLanguage = languages.find((l) => l.id === config.language) || languages[0]!;

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    if (config.theme === newTheme) return;

    if (!document.startViewTransition) {
      setConfig((prev) => ({ ...prev, theme: newTheme }));
      return;
    }

    document.startViewTransition(() => {
      setConfig((prev) => ({ ...prev, theme: newTheme }));
    });
  };

  return (
    <div className='flex flex-col font-mono gap-2'>
      <span className='font-semibold font-sans text-xl text-tw-primary'>Apariencia</span>
      <div className='flex flex-col gap-8 px-3 mt-2'>
        <div className='flex flex-col gap-2'>
          <label className='text-tw-muted uppercase tracking-wider'>Theme:</label>
          <div className='flex flex-row gap-15 ml-15'>
            <motion.button
              whileHover={config.theme === 'light' ? { scale: 1 } : { scale: 1.02 }}
              whileTap={config.theme === 'light' ? { scale: 1 } : { scale: 0.96 }}
              className={`border rounded-lg px-3 py-2 w-22 transition-all duration-150 ${
                config.theme === 'light'
                  ? 'bg-tw-accent/10 border-tw-accent shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'bg-tw-surface border-tw-border hover:border-tw-border-highlight cursor-pointer'
              }`}
              onClick={() => handleThemeChange('light')}
              disabled={config.theme === 'light'}>
              <div className='flex flex-col gap-1 items-center px-2'>
                <Sun
                  className={`w-6 h-6 transition-colors duration-300 ${config.theme === 'light' ? 'text-tw-accent' : 'text-tw-muted-deep'}`}
                />
                <span className={`uppercase ${config.theme === 'light' ? 'text-tw-primary' : 'text-tw-muted-deep'}`}>
                  Claro
                </span>
              </div>
            </motion.button>

            <motion.button
              whileHover={config.theme === 'dark' ? { scale: 1 } : { scale: 1.02 }}
              whileTap={config.theme === 'dark' ? { scale: 1 } : { scale: 0.96 }}
              className={`border rounded-lg px-3 py-2 w-22 transition-all duration-150 ${
                config.theme === 'dark'
                  ? 'bg-tw-alt/10 border-tw-alt shadow-[0_0_15px_rgba(124,58,237,0.1)]'
                  : 'bg-tw-surface border-tw-border hover:border-tw-border-highlight cursor-pointer'
              }`}
              onClick={() => handleThemeChange('dark')}
              disabled={config.theme === 'dark'}>
              <div className='flex flex-col gap-1 items-center px-2'>
                <Moon
                  className={`w-6 h-6 transition-colors duration-300 ${config.theme === 'dark' ? 'text-tw-alt' : 'text-tw-muted-deep'}`}
                />
                <span className={`uppercase ${config.theme === 'dark' ? 'text-tw-primary' : 'text-tw-muted-deep'}`}>
                  Oscuro
                </span>
              </div>
            </motion.button>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <label className='text-tw-muted uppercase tracking-wider'>Idioma:</label>
          <div className='relative w-56'>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center justify-between w-full bg-tw-surface border border-tw-border text-tw-primary rounded-lg px-4 py-2 font-mono transition-all hover:border-tw-border-highlight cursor-pointer ${isOpen ? 'border-tw-accent ring-1 ring-tw-accent/20' : ''}`}>
              <span>{currentLanguage.label}</span>
              <ChevronDown
                className={`w-4 h-4 text-tw-muted-deep transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <>
                  {/* Backdrop invisible para cerrar al hacer click fuera */}
                  <div className='fixed inset-0 z-30' onClick={() => setIsOpen(false)} />

                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='absolute z-40 w-full bg-tw-surface border border-tw-border rounded-xl shadow-2xl overflow-hidden py-1 backdrop-blur-md'>
                    {languages.map((lang) => (
                      <li
                        key={lang.id}
                        onClick={() => {
                          setConfig((prev) => ({ ...prev, language: lang.id }));
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors hover:bg-tw-base-highlight group ${
                          config.language === lang.id ? 'text-tw-accent' : 'text-tw-primary'
                        }`}>
                        <span>{lang.label}</span>
                        {config.language === lang.id && <Check className='w-3.5 h-3.5' />}
                      </li>
                    ))}
                  </motion.ul>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

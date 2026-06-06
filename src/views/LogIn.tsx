import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogInSignOn } from '@/components/LogIn/LogIn_SignOn';
import { Sun, Moon } from 'lucide-react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigContext } from '@/frontend';
import '../index.css';

export function LogIn() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { config, setConfig } = useContext(ConfigContext);

  const toggleTheme = () => {
    if (!document.startViewTransition) {
      setConfig((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
      return;
    }
    document.startViewTransition(() => {
      setConfig((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className='min-h-screen bg-tw-base text-tw-primary flex flex-col items-center justify-center relative overflow-hidden'>
      <div className='absolute inset-0 bg-[linear-gradient(var(--color-tw-glass)_1px,transparent_1px),linear-gradient(90deg,var(--color-tw-glass)_1px,transparent_1px)] bg-size-[48px_48px] opacity-[0.02] pointer-events-none' />
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_40%,var(--color-tw-base)_100%)] pointer-events-none' />

      <div className='absolute top-6 left-6 z-20 flex items-center gap-4'>
        <button
          onClick={toggleTheme}
          className='p-2 border border-tw-border-deep/50 hover:border-tw-border bg-tw-primary hover:bg-tw-primary-highlight rounded-lg transition-all cursor-pointer group'
          title={t('nav.toggleTheme', { mode: t(`nav.${config.theme === 'dark' ? 'light' : 'dark'}`) })}>
          {config.theme === 'dark' ? (
            <Sun className='w-4 h-4 text-tw-base group-hover:text-tw-accent transition-colors' />
          ) : (
            <Moon className='w-4 h-4 text-tw-base group-hover:text-tw-alt transition-colors' />
          )}
        </button>

        <Link to='/' className='group flex flex-col gap-0.5'>
          <span className='font-mono text-sm font-bold text-tw-primary tracking-[0.12em] uppercase group-hover:text-tw-primary-deep transition-colors duration-200'>
            PC·BUILDER
          </span>
          <span className='font-mono text-[0.6rem] text-tw-muted-deep tracking-[0.2em] uppercase'>
            {t('nav.tagline')}
          </span>
        </Link>
      </div>

      <div className='relative w-full max-w-sm mx-auto px-4 z-10'>
        <div className='absolute -inset-1px rounded-2xl bg-linear-to-br from-tw-glass/10 via-tw-glass/3 to-transparent pointer-events-none' />
        <div className='relative rounded-2xl border border-tw-border bg-tw-surface-deep/95 backdrop-blur-xl z-10 overflow-hidden'>
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-tw-glass/10 to-transparent' />
          <LogInSignOn onAuthSuccess={() => {
            sessionStorage.setItem('from_login', 'true');
            navigate('/');
          }} />
        </div>
      </div>

      <p className='absolute bottom-6 font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest z-10'>
        {t('login.versionBeta')}
      </p>
    </motion.div>
  );
}

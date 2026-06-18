import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, User, LogOut, Sun, Moon, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageDropdown } from '@/components/LanguageDropdown';
import type { BuildComponent } from '@/types/Frontend_types';

interface AppHeaderProps {
  buildComponents: BuildComponent[];
  setActiveTab: (tab: 'search' | 'build') => void;
  session: any; // Ideally import Auth session type
  isPending: boolean;
  handleLogout: () => void;
  config: { theme: 'light' | 'dark' | string };
  toggleTheme: () => void;
}

export function AppHeader({
  buildComponents,
  setActiveTab,
  session,
  isPending,
  handleLogout,
  config,
  toggleTheme,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className='sticky top-0 z-20 border-b border-tw-border-deep bg-tw-base/85 backdrop-blur-xl px-6 py-4'>
      <div className='max-w-7xl mx-auto flex items-center justify-between'>
        <Link to='/' className='group flex flex-col gap-0.5'>
          <span className='font-mono text-sm font-bold text-tw-primary tracking-[0.12em] uppercase group-hover:text-tw-primary-deep transition-colors'>
            PC·BUILDER
          </span>
          <span className='font-mono text-[0.6rem] text-tw-muted-deep tracking-[0.2em] uppercase'>
            {t('nav.tagline')}
          </span>
        </Link>

        <div className='flex items-center gap-3'>
          {buildComponents.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab('build')}
              className='hidden min-[600px]:flex items-center gap-2 border border-tw-glass/10 hover:border-tw-glass/20 bg-tw-base-highlight/4 hover:bg-tw-base-highlight/7 text-tw-primary font-mono text-xs px-3 py-2 rounded-lg transition-all cursor-pointer'>
              <span className='font-mono w-4 h-4 bg-tw-base-highlight/10 rounded flex items-center justify-center text-[0.6rem] font-bold'>
                {buildComponents.length}
              </span>
              {t('nav.myBuild')}
            </motion.button>
          )}

          {!session && (
            <>
              <LanguageDropdown />
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
            </>
          )}

          {isPending ? (
            <div className='h-9 w-24 bg-tw-surface/50 border border-tw-border/50 rounded-lg animate-pulse' />
          ) : session ? (
            <div className='relative'>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className='flex items-center gap-2.5 px-2.5 py-2 border border-tw-border/50 hover:border-tw-border bg-tw-surface/50 hover:bg-tw-surface rounded-lg transition-all cursor-pointer group'>
                <div className='w-6 h-6 rounded-md bg-tw-primary border border-tw-border/50 flex items-center justify-center font-mono text-[0.6rem] font-bold text-tw-surface-deep group-hover:text-tw-primary transition-colors'>
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className='font-mono text-xs text-tw-muted group-hover:text-tw-primary hidden sm:block transition-colors'>
                  {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0]}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-tw-muted transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div className='fixed inset-0 z-10' onClick={() => setShowUserMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className='absolute right-0 mt-2 w-52 bg-tw-surface/98 backdrop-blur-xl border border-tw-border rounded-xl shadow-2xl shadow-black/40 z-20 overflow-hidden'>
                      <div className='px-4 py-3 border-b border-tw-border/50'>
                        <p className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest'>
                          {t('nav.activeSession')}
                        </p>
                        <p className='font-mono text-xs text-tw-muted mt-0.5 truncate'>{session.user.email}</p>
                      </div>
                      <div className='p-1.5 space-y-0.5'>
                        <Link
                          to='/account'
                          onClick={() => setShowUserMenu(false)}
                          className='flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-tw-muted hover:text-tw-primary hover:bg-tw-base-highlight/5 rounded-lg transition-all'>
                          <User className='w-3.5 h-3.5' />
                          {t('nav.settings')}
                        </Link>
                        <button
                          onClick={handleLogout}
                          className='w-full flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-tw-alert/70 hover:text-tw-alert-highlight hover:bg-tw-alert/5 rounded-lg transition-all cursor-pointer'>
                          <LogOut className='w-3.5 h-3.5' />
                          {t('nav.signOut')}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to='/login'
              className='font-mono text-xs text-tw-mute border text-tw-base border-tw-border-deep/50 hover:border-tw-accent/75 bg-tw-primary hover:bg-tw-primary-highlight hover:text-tw-accent px-2 py-2 rounded-lg transition-all'>
              <div className='flex items-center gap-2'>
                <LogIn className='w-3.5 h-3.5 text-tw-base' />
                <span className='text-xs text-tw-base hidden min-[480px]:inline'>{t('nav.signIn')}</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

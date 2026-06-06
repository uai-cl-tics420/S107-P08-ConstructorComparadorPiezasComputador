import { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LogInForm from './LogInForm';
import SignOnForm from './SignOnForm';
import LoginMethodSelector from './LoginMethodSelector';
import OTPSignOn from './OTPSignOn';

export type ViewType = 'selection' | 'login' | 'signon' | 'OTP';

interface LoginContextType {
  setView: (view: ViewType) => void;
  onAuthSuccess: () => void;
}

const LoginContext = createContext<LoginContextType | undefined>(undefined);

export const useLoginView = () => {
  const context = useContext(LoginContext);
  if (!context) throw new Error('useLoginView must be used inside LogInSignOn');
  return context;
};

const viewVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

interface Props {
  onAuthSuccess: () => void;
}

const LogInSignOnContent = ({ onAuthSuccess }: Props) => {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewType>('selection');

  const meta = {
    title: t(`login.views.${view}.title`),
    sub: t(`login.views.${view}.sub`),
  };

  return (
    <LoginContext.Provider value={{ setView, onAuthSuccess }}>
      <div className='p-8 flex flex-col gap-6'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={view + '-header'}
            variants={viewVariant}
            initial='hidden'
            animate='visible'
            exit='exit'
            className='space-y-1.5'>
            <h2 className='text-2xl font-black tracking-tighter text-tw-primary leading-none'>{meta.title}</h2>
            <p className='font-mono text-[0.6rem] text-tw-muted uppercase tracking-[0.18em]'>{meta.sub}</p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode='wait'>
          <motion.div key={view} variants={viewVariant} initial='hidden' animate='visible' exit='exit'>
            {view === 'selection' && <LoginMethodSelector />}
            {view === 'login' && <LogInForm />}
            {view === 'signon' && <SignOnForm />}
            {view === 'OTP' && <OTPSignOn />}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {view !== 'selection' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='border-t border-tw-border-deep pt-4 text-center'>
              <button
                onClick={() => setView('selection')}
                className='font-mono text-[0.6rem] text-tw-muted-deep hover:text-tw-muted-highlight uppercase tracking-widest transition-colors duration-200 cursor-pointer'>
                {t('login.backToMethods')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LoginContext.Provider>
  );
};

export const LogInSignOn = ({ onAuthSuccess }: Props) => <LogInSignOnContent onAuthSuccess={onAuthSuccess} />;

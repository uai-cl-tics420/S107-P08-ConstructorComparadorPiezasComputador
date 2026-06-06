import { motion, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { signIn } from '@/lib/auth/auth-client';
import { useLoginView } from './LogIn_SignOn';

const GoogleIcon = () => (
  <svg className='w-4 h-4 shrink-0' viewBox='0 0 24 24'>
    <path d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' fill='#4285F4' />
    <path d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' fill='#34A853' />
    <path d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z' fill='#FBBC05' />
    <path d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' fill='#EA4335' />
  </svg>
);

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function LoginMethodSelector() {
  const { t } = useTranslation();
  const { setView } = useLoginView();

  const handleGoogleLogin = async () => {
    await signIn.social({ provider: 'google', callbackURL: '/' });
  };

  return (
    <motion.div initial='hidden' animate='visible' className='flex flex-col gap-2.5'>
      <motion.button
        custom={0}
        variants={itemVariant}
        whileHover={{ scale: 1.015, boxShadow: '0 0 20px var-(--color-tw-btn-glow), 0 4px 16px var(--color-tw-btn-shadow)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={handleGoogleLogin}
        className='w-full flex items-center justify-center gap-2.5 bg-tw-primary hover:bg-tw-primary-highlight text-tw-base font-bold font-mono text-xs py-3 rounded-lg transition-colors duration-150 cursor-pointer'>
        <GoogleIcon />
        {t('login.continueWithGoogle')}
      </motion.button>

      <div className='flex items-center gap-3 my-0.5'>
        <div className='flex-1 h-px bg-tw-base-highlight' />
        <span className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest'>{t('login.or')}</span>
        <div className='flex-1 h-px bg-tw-base-highlight' />
      </div>

      <motion.button
        custom={1}
        variants={itemVariant}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setView('login')}
        className='w-full font-mono text-xs text-tw-primary-deep border border-tw-glass/10 hover:border-tw-glass/28 hover:bg-tw-glass/4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer'>
        {t('login.signInWithCredentials')}
      </motion.button>

      <motion.button
        custom={2}
        variants={itemVariant}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setView('OTP')}
        className='w-full font-mono text-xs text-tw-primary-deep border border-tw-glass/10 hover:border-tw-glass/28 hover:bg-tw-glass/4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer'>
        {t('login.continueWithOTP')}
      </motion.button>

      <motion.button
        custom={3}
        variants={itemVariant}
        whileTap={{ scale: 0.98 }}
        onClick={() => setView('signon')}
        className='w-full font-mono text-xs text-tw-muted hover:text-tw-muted-highlight py-2 transition-colors duration-200 cursor-pointer'>
        {t('login.firstTime')}
      </motion.button>
    </motion.div>
  );
}

import { motion, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { signIn } from '@/lib/auth/auth-client';
import { useLoginView } from './LogIn_SignOn';
import { useEffect, useState } from 'react';
import { a } from 'framer-motion/client';
import { Loader2 } from 'lucide-react';
import type { Toast } from '@/types/Frontend_types';

const GoogleIcon = ({ muted }: { muted: boolean }) => (
  <svg className={`w-4 h-4 shrink-0 ${muted ? 'opacity-80' : ''}`} viewBox='0 0 24 24'>
    <path
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
      fill='#4285F4'
    />
    <path
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
      fill='#34A853'
    />
    <path
      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z'
      fill='#FBBC05'
    />
    <path
      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
      fill='#EA4335'
    />
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

export default function LoginMethodSelector({
  addToast,
}: {
  addToast: (message: string, type?: Toast['type']) => void;
}) {
  const { t } = useTranslation();
  const { setView } = useLoginView();
  const [isLoading, setLoading] = useState(true);
  const [otpAvailable, setOtpAvailable] = useState(false);
  const [ssoAvailable, setSsoAvailable] = useState(false);

  const handleGoogleLogin = async () => {
    await signIn.social({ provider: 'google', callbackURL: '/' });
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    setLoading(true);
    const setValues = async (otp: boolean, sso: boolean) => {
      setOtpAvailable(otp);
      setSsoAvailable(sso);
    };

    const fetchData = async () => {
      try {
        const res = await fetch('/api/availability', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Request error, ${res.status}`);
        }

        const body = await res.json();

        await setValues(body.otp, body.sso);

        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  return (
    <motion.div initial='hidden' animate='visible' className='flex flex-col gap-2.5'>
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className='h-72 bg-base flex items-center justify-center'>
          <div className='flex flex-col items-center gap-3'>
            <Loader2 className='w-5 h-5 text-tw-primary animate-spin' />
            <span className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest'>Iniciando...</span>
          </div>
        </motion.div>
      ) : (
        <>
          <motion.button
            custom={0}
            variants={itemVariant}
            whileHover={
              ssoAvailable
                ? {
                    scale: 1.015,
                    boxShadow: '0 0 20px var-(--color-tw-btn-glow), 0 4px 16px var(--color-tw-btn-shadow)',
                  }
                : {}
            }
            whileTap={ssoAvailable ? { scale: 0.98 } : {}}
            transition={ssoAvailable ? { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] } : {}}
            onClick={ssoAvailable ? handleGoogleLogin : async () => addToast('Servicio no disponible', 'error')}
            className={`w-full flex items-center justify-center gap-2.5  font-bold font-mono text-xs py-3 rounded-lg ${ssoAvailable ? 'bg-tw-primary hover:bg-tw-primary-highlight text-tw-base transition-colors duration-150 cursor-pointer' : 'bg-tw-primary/80 text-tw-base/70'}`}>
            <GoogleIcon muted={!ssoAvailable} />
            {t('login.continueWithGoogle')}
          </motion.button>

          <div className='flex items-center gap-3 my-0.5'>
            <div className='flex-1 h-px bg-tw-base-highlight' />
            <span className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest'>
              {t('login.or')}
            </span>
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
            whileHover={{ scale: otpAvailable ? 1.01 : 1 }}
            whileTap={{ scale: otpAvailable ? 0.98 : 1 }}
            onClick={otpAvailable ? () => setView('otp') : async () => addToast('Servicio no disponible', 'error')}
            className={`w-full font-mono text-xs border py-2.5 rounded-lg border-tw-glass/10 ${otpAvailable ? 'transition-all duration-200 cursor-pointer text-tw-primary-deep hover:border-tw-glass/28 hover:bg-tw-glass/4' : 'text-tw-muted-deep bg-tw-bg'}`}>
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
        </>
      )}
    </motion.div>
  );
}

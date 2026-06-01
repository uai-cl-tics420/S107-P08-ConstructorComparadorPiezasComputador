import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth/auth-client';
import { useLoginView } from './LogIn_SignOn';

const inputClass =
  'w-full font-mono text-sm bg-tw-surface border border-tw-border-deep text-tw-primary placeholder-tw-muted-deep rounded-lg px-4 py-2.5 focus:outline-none focus:border-tw-border-highlight transition-colors duration-200';
const labelClass = 'font-mono text-[9px] text-tw-muted uppercase tracking-[0.15em]';

export default function OTPSignOn() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { onAuthSuccess } = useLoginView();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    await authClient.emailOtp.sendVerificationOtp(
      { email, type: 'sign-in' },
      {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onSuccess: () => setStep('verify'),
        onError: (ctx) => {
          setError(ctx.error.message === 'Invalid email' ? t('login.errorInvalidEmail') : t('login.errorSendingCode'));
        },
      },
    );
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    await authClient.signIn.emailOtp(
      { email, otp, callbackURL: '/' },
      {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onSuccess: () => onAuthSuccess(),
        onError: (ctx) => {
          switch (ctx.error.message) {
            case 'Invalid OTP':
              setError(t('login.errorInvalidOTP'));
              break;
            case 'Too many attempts':
              setError(t('login.errorTooManyAttempts'));
              break;
            default:
              setError(ctx.error.message || t('login.errorSendingCode'));
          }
        },
      },
    );
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpArray];
    newOtp[index] = value.substring(value.length - 1);
    setOtpArray(newOtp);
    setOtp(newOtp.join(''));
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <form onSubmit={step === 'request' ? handleSendOTP : handleVerifyOTP} className='flex flex-col gap-4'>
      {error && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className='bg-tw-alert/8 border border-tw-alert/20 text-tw-alert-highlight font-mono text-xs px-3 py-2.5 rounded-lg'>
          {error}
        </motion.div>
      )}

      {step === 'request' && (
        <div className='flex flex-col gap-2'>
          <label className={labelClass} htmlFor='otp-email'>{t('login.emailLabel')}</label>
          <input id='otp-email' type='email' value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={t('login.emailPlaceholder')} className={inputClass} required />
        </div>
      )}

      {step === 'verify' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className='flex flex-col items-center gap-5 py-2'>
          <p className='font-mono text-[9px] text-tw-muted uppercase tracking-widest text-center'>
            {t('login.otpSentTo')}<br />
            <span className='text-tw-muted-highlight mt-0.5 block'>{email}</span>
          </p>
          <div className='flex gap-2'>
            {otpArray.map((digit, index) => (
              <motion.input
                key={index}
                type='text'
                maxLength={1}
                value={digit}
                ref={(el) => { inputRefs.current[index] = el; }}
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                whileFocus={{ borderColor: 'rgba(255,255,255,0.3)', scale: 1.04 }}
                className='w-10 h-12 bg-tw-surface border border-tw-border-deep rounded-lg text-tw-primary text-center font-mono text-lg font-bold focus:outline-none transition-colors cursor-text'
              />
            ))}
          </div>
          <button type='button'
            onClick={() => { setStep('request'); setOtpArray(['', '', '', '', '', '']); setOtp(''); }}
            className='font-mono text-[9px] text-tw-muted-deep hover:text-tw-muted uppercase tracking-widest transition-colors duration-200'>
            {t('login.otpRetry')}
          </button>
        </motion.div>
      )}

      <motion.button
        type='submit'
        disabled={loading}
        whileHover={!loading ? { scale: 1.015, boxShadow: '0 0 20px rgba(255,255,255,0.2), 0 4px 16px rgba(0,0,0,0.5)' } : {}}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        className='mt-1 w-full flex items-center justify-center gap-2 bg-tw-primary hover:bg-tw-primary-highlight disabled:bg-tw-primary-deep text-tw-base font-bold font-mono text-xs py-3 rounded-lg transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed'>
        {loading ? (
          <><Loader2 className='w-3.5 h-3.5 animate-spin' />
            {step === 'request' ? t('login.sendingCode') : t('login.verifyingCode')}
          </>
        ) : step === 'request' ? t('login.sendCode') : t('login.verifyCode')}
      </motion.button>
    </form>
  );
}

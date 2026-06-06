import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signUp } from '@/lib/auth/auth-client';
import { validatePassword } from '@/lib/auth/validators';
import { useLoginView } from './LogIn_SignOn';

const inputClass =
  'w-full font-mono text-sm bg-tw-surface border border-tw-border-deep text-tw-primary placeholder-tw-muted-deep rounded-lg px-4 py-2.5 focus:outline-none focus:border-tw-border-highlight transition-colors duration-200';
const labelClass = 'font-mono text-[0.6rem] text-tw-muted uppercase tracking-[0.15em]';

export default function SignOnForm() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { onAuthSuccess } = useLoginView();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.message!.join('\n'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('login.errorPasswordMismatch'));
      return;
    }
    setLoading(true);
    setError(null);
    await signUp.email(
      { email, password, name, callbackURL: '/' },
      {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onError: (ctx) => {
          switch (ctx.error.message) {
            case '[body.email] Invalid email address':
              setError(t('login.errorInvalidEmail'));
              break;
            case 'User already exists. Use another email.':
              setError(t('login.errorEmailInUse'));
              break;
            default:
              setError(t('login.errorCreatingAccount'));
          }
        },
        onSuccess: () => onAuthSuccess(),
      },
    );
  };

  const passwordMismatch = confirmPassword !== '' && password !== confirmPassword;

  return (
    <form onSubmit={handleSignUp} className='flex flex-col gap-3.5'>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-tw-alert/8 border border-tw-alert/20 text-tw-alert-highlight font-mono text-xs px-3 py-2.5 rounded-lg whitespace-pre-line'>
          {error}
        </motion.div>
      )}

      <div className='flex flex-col gap-2'>
        <label className={labelClass} htmlFor='name'>{t('login.usernameLabel')}</label>
        <input id='name' type='text' value={name} onChange={(e) => setName(e.target.value)}
          placeholder={t('login.usernamePlaceholder')} className={inputClass} required />
      </div>

      <div className='flex flex-col gap-2'>
        <label className={labelClass} htmlFor='email-signup'>{t('login.emailLabel')}</label>
        <input id='email-signup' type='email' value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t('login.emailPlaceholder')} className={inputClass} required />
      </div>

      <div className='flex flex-col gap-2'>
        <label className={labelClass} htmlFor='password-signup'>{t('login.passwordLabel')}</label>
        <input id='password-signup' type='password' value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder='••••••••' className={inputClass} required minLength={8} />
      </div>

      <div className='flex flex-col gap-2'>
        <label className={labelClass} htmlFor='confirm-password'>{t('login.confirmPasswordLabel')}</label>
        <input id='confirm-password' type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder='••••••••'
          className={`${inputClass} ${passwordMismatch ? 'border-tw-alert/40! text-tw-alert-highlight' : ''}`} />
      </div>

      <motion.button
        type='submit'
        disabled={loading}
        whileHover={!loading ? { scale: 1.015, boxShadow: '0 0 20px var(--color-tw-btn-glow), 0 4px 16px var(--color-tw-btn-shadow)' } : {}}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        className='mt-1 w-full flex items-center justify-center gap-2 bg-tw-primary hover:bg-tw-primary-highlight disabled:bg-tw-primary-deep text-tw-base font-bold font-mono text-xs py-3 rounded-lg transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed'>
        {loading ? (
          <><Loader2 className='w-3.5 h-3.5 animate-spin' />{t('login.creatingAccount')}</>
        ) : (
          t('login.createAccount')
        )}
      </motion.button>
    </form>
  );
}

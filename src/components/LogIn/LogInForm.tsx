import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth/auth-client';
import { useLoginView } from './LogIn_SignOn';

const inputClass = 'w-full font-mono text-sm bg-[#0F0F0F] border border-[#1E1E1E] text-white placeholder-zinc-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#333] transition-colors duration-200';
const labelClass = 'font-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em]';

export default function LogInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { onAuthSuccess } = useLoginView();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    await signIn.email(
      { email, password, callbackURL: '/' },
      {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onError: (ctx) => {
          switch (ctx.error.message) {
            case 'Invalid email':
              setError('El email no es válido');
              break;
            case 'Invalid email or password':
              setError('Email o contraseña incorrectos');
              break;
            default:
              setError('Error al iniciar sesión');
          }
        },
        onSuccess: () => onAuthSuccess(),
      },
    );
  };

  return (
    <form onSubmit={handleLogin} className='flex flex-col gap-4'>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-red-500/8 border border-red-500/20 text-red-400 font-mono text-[10px] px-3 py-2.5 rounded-lg'
        >
          {error}
        </motion.div>
      )}

      <div className='flex flex-col gap-2'>
        <label className={labelClass} htmlFor='email'>Email</label>
        <input
          id='email'
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='tu@email.com'
          className={inputClass}
          required
        />
      </div>

      <div className='flex flex-col gap-2'>
        <label className={labelClass} htmlFor='password'>Contraseña</label>
        <input
          id='password'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='••••••••'
          className={inputClass}
          required
        />
      </div>

      {/* CTA primario — blanco sólido con glow + spinner */}
      <motion.button
        type='submit'
        disabled={loading}
        whileHover={!loading ? {
          scale: 1.015,
          boxShadow: '0 0 20px rgba(255,255,255,0.2), 0 4px 16px rgba(0,0,0,0.5)',
        } : {}}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        className='mt-1 w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 disabled:bg-zinc-200 text-black font-bold font-mono text-xs py-3 rounded-lg transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed'
      >
        {loading ? (
          <>
            <Loader2 className='w-3.5 h-3.5 animate-spin' />
            Verificando...
          </>
        ) : (
          'Iniciar sesión'
        )}
      </motion.button>
    </form>
  );
}

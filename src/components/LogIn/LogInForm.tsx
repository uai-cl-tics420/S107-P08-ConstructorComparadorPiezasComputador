import { useState } from 'react';
import { signIn } from '@/lib/auth/auth-client';
import { useNavigate } from 'react-router-dom';

export default function LogInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await signIn.email(
      {
        email,
        password,
        callbackURL: '/',
      },
      {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onError: (ctx) => {
          switch (ctx.error.message) {
            case 'Invalid email':
              setError('El email no es válido');
              break;
            case 'Invalid email or password':
              setError('El email o contraseña son icorrectos');
              break;
            default:
              setError('Error al crear la cuenta');
          }
        },
        onSuccess: () => {
          navigate('/');
        },
      },
    );
  };

  return (
    <form onSubmit={handleLogin} className='flex flex-col gap-4'>
      {error && (
        <div className='bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-2 rounded whitespace-pre-line'>
          {error}
        </div>
      )}

      <div className='flex flex-col gap-1.5'>
        <label className='text-sm text-gray-300' htmlFor='email'>
          Email
        </label>
        <input
          id='email'
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='tu@email.com'
          className='bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-500'
          required
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <label className='text-sm text-gray-300' htmlFor='password'>
          Contraseña
        </label>
        <input
          id='password'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='••••••••'
          className='bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-500'
          required
        />
      </div>

      <button
        type='submit'
        className='mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors'>
        Entrar
      </button>
    </form>
  );
}

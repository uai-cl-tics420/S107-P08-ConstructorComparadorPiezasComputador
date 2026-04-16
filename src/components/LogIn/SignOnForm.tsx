import { useState } from 'react';
import { signUp } from '@/lib/auth/auth-client';
import { useNavigate } from 'react-router-dom';

export default function SignOnForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Nuevo estado
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación local: ¿Las contraseñas coinciden?
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: authError } = await signUp.email(
      {
        email,
        password,
        name,
        callbackURL: '/',
      },
      {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onError: (ctx) => {
          setError(ctx.error.message || 'Error al crear la cuenta');
        },
        onSuccess: () => {
          navigate('/');
        },
      },
    );
  };

  return (
    <form onSubmit={handleSignUp} className='flex flex-col gap-4'>
      {error && <div className='bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-2 rounded'>{error}</div>}

      {/* Campo: Nombre */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm text-gray-300' htmlFor='name'>
          Nombre completo
        </label>
        <input
          id='name'
          type='text'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Tu nombre'
          className='bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-500'
          required
        />
      </div>

      {/* Campo: Email */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm text-gray-300' htmlFor='email-signup'>
          Email
        </label>
        <input
          id='email-signup'
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='tu@email.com'
          className='bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-500'
          required
        />
      </div>

      {/* Campo: Contraseña */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm text-gray-300' htmlFor='password-signup'>
          Contraseña
        </label>
        <input
          id='password-signup'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='••••••••'
          className='bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-500'
          required
          minLength={8}
        />
      </div>

      {/* Campo: Confirmar Contraseña */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm text-gray-300' htmlFor='confirm-password'>
          Confirmar contraseña
        </label>
        <input
          id='confirm-password'
          type='password'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder='••••••••'
          className={`bg-[#0f1117] border ${password !== confirmPassword && confirmPassword !== '' ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-500`}
          required
        />
      </div>

      <button
        type='submit'
        disabled={loading}
        className='mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors'>
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  );
}

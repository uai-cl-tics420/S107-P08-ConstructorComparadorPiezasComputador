import { authClient } from '@/lib/auth/auth-client';
import { set } from 'better-auth';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OTPSignOn() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { data, error } = await authClient.emailOtp.sendVerificationOtp(
      {
        email: email,
        type: 'sign-in',
      },
      {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onSuccess: () => {
          setStep('verify');
        },
        onError: (ctx) => {
          switch (ctx.error.message) {
            case 'Invalid email':
              setError('El email no es válido');
              break;
            default:
              setError(ctx.error.message || 'Error al enviar el código');
          }
        },
      },
    );
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    await authClient.signIn.emailOtp(
      {
        email,
        otp,
        callbackURL: '/',
      },
      {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onSuccess: () => {
          navigate('/');
        },
        onError: (ctx) => {
          switch (ctx.error.message) {
            case 'Invalid OTP':
              setError('Código incorrecto');
              break;
            case 'Too many attempts':
              setError('Demasiados intentos, vuelva atrás e ingrese su email neuvamente');
              break;
            default:
              setError(ctx.error.message || 'Error al verificar el código');
          }
        },
      },
    );
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; // Solo números

    const newOtp = [...otpArray];
    newOtp[index] = value.substring(value.length - 1);
    setOtpArray(newOtp);

    // Actualizar el string OTP final para BetterAuth
    setOtp(newOtp.join(''));

    // Avanzar al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className='flex-1 flex flex-col'>
      <form
        onSubmit={step === 'request' ? handleSendOTP : handleVerifyOTP}
        className='flex-1 flex flex-col gap-4 justify-between'>
        <div>
          {error && (
            <div className='bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-2 rounded whitespace-pre-line mb-4'>
              {error}
            </div>
          )}
          {step === 'request' && (
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
          )}
          {step === 'verify' && (
            <div className='flex flex-col gap-6 items-center py-4'>
              <p className='text-sm text-gray-400'>Ingresa el código de 6 dígitos</p>
              <div className='flex gap-2 justify-center'>
                {otpArray.map((digit, index) => (
                  <input
                    key={index}
                    type='text'
                    maxLength={1}
                    value={digit}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className='w-10 h-12 bg-[#0f1117] border border-white/10 rounded-lg text-white text-center text-xl font-bold focus:border-blue-500 focus:outline-none transition-colors'
                  />
                ))}
              </div>
              <button
                type='button'
                onClick={() => setStep('request')}
                className='text-xs text-blue-500 hover:text-blue-400'>
                ¿No llega el código? Volver atrás
              </button>
            </div>
          )}
        </div>

        <button
          type='submit'
          disabled={loading}
          className='mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-colors'>
          {loading ? 'Procesando...' : step === 'request' ? 'Enviar código' : 'Verificar'}
        </button>
      </form>
    </div>
  );
}

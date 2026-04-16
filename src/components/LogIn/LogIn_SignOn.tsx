import { useState } from 'react';
import LogInForm from './LogInForm';
import SignOnForm from './SignOnForm';

export const LogInSignOn = () => {
  const [view, setView] = useState<'login' | 'signon'>('login');

  return (
    <div className='w-full h-full flex flex-col justify-center p-8'>
      <div className='flex-col w-full'>
        <h2 className='text-xl font-bold text-white'>{view === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
        <p className='text-gray-400 text-sm mb-6'>
          {view === 'login' ? 'Ingresa tus credenciales para continuar' : 'Regístrate para guardar tus builds'}
        </p>

        {view === 'login' ? <LogInForm /> : <SignOnForm />}

        <div className='mt-6 text-center border-t border-white/5'>
          {view === 'login' ? (
            <p className='text-gray-400 text-sm'>
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => setView('signon')}
                className='text-blue-500 hover:text-blue-400 font-medium transition-colors cursor-pointer bg-transparent border-none p-0'>
                Regístrate
              </button>
            </p>
          ) : (
            <p className='text-gray-400 text-sm'>
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => setView('login')}
                className='text-blue-500 hover:text-blue-400 font-medium transition-colors cursor-pointer bg-transparent border-none p-0'>
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

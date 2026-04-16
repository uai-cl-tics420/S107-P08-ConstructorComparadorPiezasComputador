import { useState, createContext, useContext } from 'react';
import LogInForm from './LogInForm';
import SignOnForm from './SignOnForm';
import LoginMethodSelector from './LoginMethodSelector';

type ViewType = 'selection' | 'login' | 'signon';
interface LoginContextType {
  setView: (view: ViewType) => void;
}
const LoginContext = createContext<LoginContextType | undefined>(undefined);

export const useLoginView = () => {
  const context = useContext(LoginContext);
  if (!context) throw new Error('useLoginView debe usarse dentro de LogInSignOn');
  return context;
};

const LogInSignOnContent = () => {
  const [view, setView] = useState<ViewType>('selection');

  const step = {
    selection: 'Bienvenido a PC Builder',
    login: 'Inicia sesión',
    signon: 'Crea tu cuenta',
  };

  return (
    <LoginContext.Provider value={{ setView }}>
      <div className='w-full h-full flex flex-col justify-center p-8'>
        <div className='flex-col w-full min-h-90'>
          <h2 className='text-xl font-bold text-white'>{step[view]}</h2>
          <p className='text-gray-400 text-sm mb-6'>
            {view === 'selection' ? 'Elige cómo quieres continuar' : 'Ingresa tus datos para continuar'}
          </p>

          {view === 'selection' && <LoginMethodSelector />}
          {view === 'login' && <LogInForm />}
          {view === 'signon' && <SignOnForm />}

          {view !== 'selection' && (
            <div className='mt-6 text-center border-t border-white/5'>
              <button
                onClick={() => setView('selection')}
                className='text-blue-500 hover:text-blue-400 text-sm mt-3 transition-colors cursor-pointer bg-transparent border-none p-0'>
                ← Volver a métodos de ingreso
              </button>
            </div>
          )}
        </div>
      </div>
    </LoginContext.Provider>
  );
};

// 3. Exportar el componente final
export const LogInSignOn = () => <LogInSignOnContent />;

import { User, Palette, Settings, LogOut, Home } from 'lucide-react';
import { Appearance } from '../components/UserConfig/Appearance';
import { UserSettings } from '../components/UserConfig/UserSettings';
import { UserData } from '../components/UserConfig/UserData';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from '@/lib/auth/auth-client';
import { useNavigate } from 'react-router-dom';

const viewList = [
  { view: UserData, name: 'Cuenta', icon: User },
  { view: Appearance, name: 'Preferencias', icon: Palette },
  { view: UserSettings, name: 'Configuración', icon: Settings },
];

export function UserConfig() {
  const [CurrentView, setView] = useState(() => viewList[0]!.view);
  const [activeView, setActiveView] = useState(viewList[0]!.name);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate('/login');
        },
      },
    });
  };
  return (
    <div className='h-screen w-screen'>
      <header className='sticky top-0 z-20 border-b border-tw-border-deep bg-tw-base/85 backdrop-blur-xl px-6 py-4'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          {/* Logo — Mono engineering */}
          <Link to='/' className='group flex flex-col gap-0.5'>
            <span className='font-mono text-sm font-bold text-tw-primary tracking-[0.12em] uppercase group-hover:text-tw-primary-deep transition-colors'>
              PC·BUILDER
            </span>
            <span className='font-mono text-[9px] text-tw-muted-deep tracking-[0.2em] uppercase'>
              Compara · Arma · Ahorra
            </span>
          </Link>
          <div className='p-1.5 space-y-0.5 flex flex-row gap-3'>
            <Link
              to='/'
              className='flex items-center gap-2.5 px-3 py-2 font-mono text-xs bg-tw-surface/98 backdrop-blur-xl border border-tw-border text-tw-muted hover:text-tw-primary hover:bg-tw-base-highlight/5 rounded-lg transition-all cursor-pointer mb-0'>
              <Home className='w-3.5 h-3.5' />
              Regresar
            </Link>
            <button
              onClick={handleLogout}
              className='flex items-center gap-2.5 px-3 py-2 font-mono text-xs bg-tw-surface/98 backdrop-blur-xl border border-tw-border text-tw-alert/70 hover:text-tw-alert-highlight hover:bg-tw-alert/5 rounded-lg transition-all cursor-pointer'>
              <LogOut className='w-3.5 h-3.5' />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className='grid grid-cols-[24%_76%] mx-auto max-w-7xl h-auto px-6 py-8'>
        <div className='flex flex-col gap-4'>
          {viewList.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.name;
            return (
              <button
                key={item.name}
                className={`flex flex-row items-center border border-dashed rounded-lg px-4 py-2 transition-all ${isActive ? 'bg-tw-base-highlight border-tw-border-highlight' : 'bg-tw-base border-tw-border hover:border-tw-border-highlight hover:bg-tw-base-highlight/30 duration-75 active:scale-[0.99]'}`}
                onClick={() => {
                  setActiveView(() => item.name);
                  setView(() => item.view);
                }}>
                <Icon className='w-6 h-6 text-tw-muted' />
                <span className='font-mono text-sm text-tw-primary tracking-[0.12em] ml-4'>{item.name}</span>
              </button>
            );
          })}
        </div>
        <div className='flex flex-row bg-tw-surface-deep ml-8 px-4 py-4 overflow-y-auto rounded-xl border border-tw-border backdrop-blur-xl'>
          <CurrentView />
        </div>
      </main>
    </div>
  );
}

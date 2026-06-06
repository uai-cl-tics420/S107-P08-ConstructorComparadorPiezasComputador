import { User, Palette, Settings, LogOut, Home, Save, Trash } from 'lucide-react';
import { Appearance } from '../components/UserConfig/Appearance';
import { UserSettings } from '../components/UserConfig/UserSettings';
import { UserData } from '../components/UserConfig/UserData';
import { useState, createContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from '@/lib/auth/auth-client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ToastContainer';
import { authClient } from '@/lib/auth/auth-client';
import { validatePassword } from '@/lib/auth/validators';
import { useTranslation } from 'react-i18next';

export const PendingContext = createContext<{
  pendingChanges: Record<string, any>;
  setPendingChanges: React.Dispatch<React.SetStateAction<Record<string, any>>> | null;
}>({ pendingChanges: {}, setPendingChanges: null });

export function UserConfig() {
  const { t } = useTranslation();

  const viewList = [
    { view: UserData, name: t('userConfig.account'), icon: User },
    { view: Appearance, name: t('userConfig.preferences'), icon: Palette },
    { view: UserSettings, name: t('userConfig.configuration'), icon: Settings },
  ];

  const [CurrentView, setView] = useState(() => viewList[0]!.view);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [isPending, setIsPending] = useState(false);
  const [activeView, setActiveView] = useState(viewList[0]!.name);
  const { toasts, addToast, removeToast } = useToast();

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

  const handleSaveChanges = async () => {
    for (const key in pendingChanges) {
      try {
        switch (key) {
          case 'name':
            await authClient.updateUser(
              { name: pendingChanges.name },
              {
                onSuccess: () => {
                  addToast(t('userConfig.saveChanges') + ' ✓', 'success');
                  setPendingChanges((prev) => {
                    const { name, ...rest } = prev;
                    return rest;
                  });
                },
                onError: () => addToast('Error', 'error'),
              },
            );
            break;
          case 'password':
            const { isValid } = validatePassword(pendingChanges.password);
            if (!isValid) {
              addToast('Contraseña no válida', 'error');
              break;
            }

            if (pendingChanges.password !== pendingChanges.confirmPassword) {
              addToast('Las contraseñas no coinciden', 'error');
              break;
            }

            if (pendingChanges.currentPassword) {
              await authClient.changePassword(
                { newPassword: pendingChanges.password, currentPassword: pendingChanges.currentPassword },
                {
                  onSuccess: () => {
                    addToast(t('userConfig.saveChanges') + ' ✓', 'success');
                    setPendingChanges((prev) => {
                      const { password, confirmPassword, currentPassword, ...rest } = prev;
                      return rest;
                    });
                  },
                  onError: () => addToast('Error', 'error'),
                },
              );
            } else {
              try {
                const response = await fetch('/api/users/set-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ newPassword: pendingChanges.password }),
                });
                if (response.ok) {
                  addToast(t('userConfig.saveChanges') + ' ✓', 'success');
                  setPendingChanges((prev) => {
                    const { password, confirmPassword, ...rest } = prev;
                    return rest;
                  });
                } else {
                  addToast('Error', 'error');
                }
              } catch (error) {
                addToast('Error de conexión al servidor', 'error');
              }
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Error updating ${key}:`, error);
      }
    }
  };

  const handleDiscardChanges = () => {
    if (window.confirm(t('common.confirmDiscard'))) {
      setPendingChanges({});
    }
  };

  useEffect(() => {
    setIsPending(Object.keys(pendingChanges).length > 0);
  }, [pendingChanges]);

  return (
    <div className='flex flex-col h-screen w-screen overflow-hidden'>
      <header className='sticky top-0 z-20 border-b border-tw-border-deep bg-tw-base/85 backdrop-blur-xl px-6 py-4 mb-4'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <Link to='/' className='group flex flex-col gap-0.5'>
            <span className='font-mono text-sm font-bold text-tw-primary tracking-[0.12em] uppercase group-hover:text-tw-primary-deep transition-colors'>
              PC·BUILDER
            </span>
            <span className='font-mono text-[0.6rem] text-tw-muted-deep tracking-[0.2em] uppercase'>
              {t('nav.tagline')}
            </span>
          </Link>
        </div>
      </header>
      <main className='flex-1 min-h-0 grid grid-cols-[24%_76%] mx-auto max-w-7xl h-full px-6 py-8'>
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
        <div className='grid grid-cols-[76%_24%] gap-2 min-h-0'>
          <div className='flex flex-col h-full bg-tw-surface-deep ml-8 px-4 py-4 overflow-y-auto rounded-xl border border-tw-border backdrop-blur-xl gap-6'>
            <PendingContext.Provider value={{ pendingChanges, setPendingChanges }}>
              <UserData />
              <Appearance />
              <UserSettings />
            </PendingContext.Provider>
          </div>
          <div className='flex flex-col gap-3'>
            <button
              onClick={handleSaveChanges}
              className={`flex items-center gap-2.5 px-3 py-2 font-mono text-xs backdrop-blur-xl border rounded-lg transition-all bg-tw-surface-deep ${isPending ? 'border-tw-success/70 text-tw-success cursor-pointer hover:border-tw-success-highlight/80 hover:bg-tw-success-highlight/5' : ' border-tw-border text-tw-muted-deep/75'}`}>
              <Save className='w-3.5 h-3.5' />
              {t('userConfig.saveChanges')}
            </button>
            <button
              onClick={handleDiscardChanges}
              className={`flex items-center gap-2.5 px-3 py-2 font-mono text-xs backdrop-blur-xl border rounded-lg transition-all bg-tw-surface-deep ${isPending ? 'border-tw-alert/70 text-tw-alert cursor-pointer hover:border-tw-alert-highlight/80 hover:bg-tw-alert-highlight/5' : ' border-tw-border text-tw-muted-deep/75'}`}>
              <Trash className='w-3.5 h-3.5' />
              {t('userConfig.discardChanges')}
            </button>
            <Link
              to='/'
              className='flex items-center gap-2.5 px-3 py-2 font-mono text-xs bg-tw-surface-deep backdrop-blur-xl border border-tw-border text-tw-muted hover:text-tw-primary hover:bg-tw-base-highlight/5 rounded-lg transition-all cursor-pointer mb-0'>
              <Home className='w-3.5 h-3.5' />
              {t('userConfig.back')}
            </Link>
            <button
              onClick={handleLogout}
              className='flex items-center gap-2.5 px-3 py-2 font-mono text-xs bg-tw-surface-deep backdrop-blur-xl border border-tw-border text-tw-alert/70 hover:text-tw-alert-highlight hover:bg-tw-alert/5 rounded-lg transition-all cursor-pointer'>
              <LogOut className='w-3.5 h-3.5' />
              {t('userConfig.signOut')}
            </button>
          </div>
        </div>
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth/auth-client';
import { motion } from 'framer-motion';
import { validatePassword } from '@/lib/auth/validators';

export function UserData() {
  const { data: sessionData, isPending } = useSession();
  const [imageError, setImageError] = useState(false);
  const [name, setName] = useState('');
  const [nameModified, setNameModified] = useState(false);
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordModified, setPasswordModified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !sessionData) {
      navigate('/login');
    }
  }, [sessionData, isPending, navigate]);

  if (isPending) {
    return <div className='p-4 font-mono'>Cargando datos de usuario...</div>;
  }

  if (!sessionData) return null;

  const { user } = sessionData;

  return (
    <div className='flex flex-col font-mono'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-row gap-4'>
          <span className='font-semibold font-sans text-xl text-tw-primary'>Información de cuenta</span>
        </div>

        <div className='flex flex-col gap-4 px-3 mt-2'>
          {user.image && !imageError ? (
            <img src={user.image} alt='Avatar' className='w-12 h-12 rounded-full' onError={() => setImageError(true)} />
          ) : (
            <div className='w-12 h-12 rounded-full bg-tw-surface border border-tw-border/50 flex items-center justify-center font-mono text-xl font-bold text-tw-muted group-hover:text-tw-primary transition-colors'>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className='flex flex-row flex-wrap gap-6'>
            <div className='flex flex-col gap-1 mr-15'>
              <label className=' text-tw-muted uppercase tracking-wider'>Nombre:</label>
              <input
                className={`bg-tw-surface border rounded w-46 px-3 py-1 text-tw-primary focus:outline-none  transition-colors ${nameModified ? 'border-tw-success/20 focus:border-tw-success/70' : 'border-tw-border focus:border-tw-primary'}`}
                placeholder={user.name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.length > 0) {
                    setNameModified(true);
                  } else {
                    setNameModified(false);
                  }
                }}
              />
              {nameModified && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  className='mt-0.5 h-0.5 w-46 origin-left rounded-full bg-tw-success'
                />
              )}
            </div>

            <div className='flex flex-col gap-1 mr-15'>
              <label className=' text-tw-muted uppercase tracking-wider'>Email:</label>
              <input
                className='bg-tw-surface border border-tw-border rounded w-46 px-3 py-1 text-tw-muted-deep focus:outline-none focus:border-tw-primary transition-colors'
                placeholder={user.email}
                disabled
              />
            </div>

            <div className='flex flex-col'>
              <label className=' text-tw-muted uppercase tracking-wider'>Cambiar contraseña:</label>
              <div className='flex flex-row gap-6'>
                <div className='flex flex-col'>
                  <input
                    type='password'
                    className={`bg-tw-surface border rounded w-46 px-3 py-1 transition-all focus:outline-none ${
                      passwordError
                        ? 'border-tw-alert/20 focus:border-tw-alert/70 text-tw-alert-highlight focus:text-tw-primary'
                        : passwordModified
                          ? 'border-tw-success/20 focus:border-tw-success/70 text-tw-primary'
                          : 'border-tw-border focus:border-tw-primary text-tw-primary'
                    }`}
                    placeholder='••••••••'
                    onChange={(e) => {
                      setPasswordData((prev) => ({ ...prev, password: e.target.value }));
                      if (!(e.target.value.length > 0)) {
                        setPasswordModified(false);
                        setPasswordError(null);
                        return;
                      }

                      setPasswordModified(true);
                      const validation = validatePassword(e.target.value);
                      if (!validation.isValid) {
                        setPasswordError(validation.message!.join('\n'));
                        return;
                      }

                      if (e.target.value !== passwordData.confirmPassword) {
                        setPasswordError('Las contraseñas no coinciden');
                        return;
                      }

                      setPasswordError(null);
                      return;
                    }}
                  />

                  {passwordModified && (
                    <>
                      <motion.div
                        initial={{ scaleX: 1 }}
                        className={`mt-0.5 h-0.5 w-46 origin-left rounded-full ${
                          passwordError ? 'bg-tw-alert' : 'bg-tw-success'
                        }`}
                      />
                      <div className='flex flex-col ml-1 pl-3 mt-1 pt-1 border-l border-tw-muted-deep'>
                        <span className='text-tw-muted text-xs uppercase'>Repita la contraseña:</span>
                        <input
                          type='password'
                          className={`bg-tw-surface border rounded w-46 px-3 py-1 transition-all focus:outline-none ${
                            passwordError
                              ? 'border-tw-alert/20 focus:border-tw-alert/70 text-tw-alert-highlight focus:text-tw-primary'
                              : passwordModified
                                ? 'border-tw-success/20 focus:border-tw-success/70 text-tw-primary'
                                : 'border-tw-border focus:border-tw-primary text-tw-primary'
                          }`}
                          placeholder='••••••••'
                          onChange={(e) => {
                            setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                            if (passwordData.password !== e.target.value) {
                              setPasswordError('Las contraseñas no coinciden');
                            } else {
                              setPasswordError(null);
                            }
                            return;
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  {passwordError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='bg-tw-alert/8 border border-tw-alert/20 text-tw-alert-highlight font-mono text-[10px] px-3 py-2.5 rounded-lg whitespace-pre-line'>
                      {passwordError}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

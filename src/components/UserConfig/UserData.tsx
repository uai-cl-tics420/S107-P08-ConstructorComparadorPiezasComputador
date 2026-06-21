import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authClient, useSession } from '@/lib/auth/auth-client';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { validatePassword } from '@/lib/auth/validators';
import { PendingContext } from '@/views/UserConfig';

export function UserData() {
  const { t } = useTranslation();
  const { data: sessionData, isPending } = useSession();
  const [imageError, setImageError] = useState(false);
  const [name, setName] = useState('');
  const [nameModified, setNameModified] = useState(false);
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '', currentPassword: '' });
  const [passwordError, setPasswordError] = useState<Record<string, string | null>>({
    newPass: null,
    confirmPass: null,
    currentPass: null,
  });
  const [passwordConfigured, setPasswordConfigured] = useState(false);
  const [passwordModified, setPasswordModified] = useState(false);
  const navigate = useNavigate();
  const { pendingChanges, setPendingChanges } = useContext(PendingContext);

  useEffect(() => {
    if (!isPending && !sessionData) navigate('/login');
  }, [sessionData, isPending, navigate]);

  useEffect(() => {
    if (!pendingChanges.name) {
      setName('');
      setNameModified(false);
    }
    if (!pendingChanges.password) {
      setPasswordData({ password: '', confirmPassword: '', currentPassword: '' });
      setPasswordModified(false);
      setPasswordError({ newPass: null, confirmPass: null, currentPass: null });
      const checkPassword = async () => {
        const res = await authClient.listAccounts();
        const hasPasswordConfigured = res.data?.some((account) => account.providerId === 'credential');
        setPasswordConfigured(hasPasswordConfigured!);
      };
      checkPassword();
    }
  }, [pendingChanges]);

  if (isPending) return <div className='p-4 font-mono'>{t('userData.loading')}</div>;
  if (!sessionData) return null;

  const { user } = sessionData;

  return (
    <div className='flex flex-col font-mono'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-row gap-4'>
          <span className='font-semibold font-sans text-xl text-tw-primary'>{t('userData.title')}</span>
        </div>

        <div className='flex flex-col gap-4 px-3 mt-2'>
          {user.image && !imageError ? (
            <img src={user.image} alt='Avatar' className='w-12 h-12 rounded-full' onError={() => setImageError(true)} />
          ) : (
            <div className='w-12 h-12 rounded-full bg-tw-surface border border-tw-border/50 flex items-center justify-center font-mono text-xl font-bold text-tw-muted'>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          <div className='flex flex-row flex-wrap gap-6'>
            {/* Name */}
            <div className='flex flex-col gap-1 mr-15'>
              <label className='text-tw-muted uppercase tracking-wider'>{t('userData.name')}</label>
              <input
                className={`bg-tw-surface border rounded w-46 px-3 py-1 text-tw-primary focus:outline-none transition-colors ${nameModified ? 'border-tw-success/20 focus:border-tw-success/70' : 'border-tw-border focus:border-tw-primary'}`}
                value={name}
                placeholder={user.name ?? ''}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.length > 0) {
                    setNameModified(true);
                    setPendingChanges!((prev) => ({ ...prev, name: e.target.value }));
                  } else {
                    setNameModified(false);
                    setPendingChanges!((prev) => {
                      const { name, ...rest } = prev;
                      return rest;
                    });
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

            {/* Email */}
            <div className='flex flex-col gap-1 mr-15'>
              <label className='text-tw-muted uppercase tracking-wider'>{t('userData.email')}</label>
              <input
                className='bg-tw-surface border border-tw-border rounded w-46 px-3 py-1 text-tw-muted-deep focus:outline-none'
                placeholder={user.email ?? ''}
                disabled
              />
            </div>

            {/* Password */}
            {passwordConfigured && (
              <div className='flex flex-col gap-1'>
                <label className='text-tw-muted uppercase tracking-wider'>t('userData.changePassword')</label>
                <div className='flex flex-row gap-6'>
                  <div className='flex flex-col'>
                    <input
                      type='password'
                      className={`bg-tw-surface border rounded w-46 px-3 py-1 transition-all focus:outline-none ${
                        passwordError.newPass
                          ? 'border-tw-alert/20 focus:border-tw-alert/70 text-tw-alert-highlight focus:text-tw-primary'
                          : passwordModified
                            ? 'border-tw-success/20 focus:border-tw-success/70 text-tw-primary'
                            : 'border-tw-border focus:border-tw-primary text-tw-primary'
                      }`}
                      value={passwordData.password}
                      placeholder='••••••••'
                      onChange={(e) => {
                        setPasswordData((prev) => ({ ...prev, password: e.target.value }));
                        if (!e.target.value.length) {
                          setPasswordModified(false);
                          setPasswordData({ password: '', confirmPassword: '', currentPassword: '' });
                          setPasswordError({ newPass: null, confirmPass: null, currentPass: null });
                          setPendingChanges!((prev) => {
                            const { password, currentPassword, confirmPassword, ...rest } = prev;
                            return rest;
                          });
                          return;
                        }
                        if (!passwordData.confirmPassword.length) {
                          setPasswordError((prev) => ({ ...prev, confirmPass: t('userData.errorRewritePassword') }));
                        } else if (e.target.value !== passwordData.confirmPassword) {
                          setPasswordError((prev) => ({ ...prev, confirmPass: t('userData.errorPasswordMismatch') }));
                        } else {
                          setPasswordError((prev) => ({ ...prev, confirmPass: null }));
                        }
                        if (!passwordData.currentPassword.length && passwordConfigured) {
                          setPasswordError((prev) => ({
                            ...prev,
                            currentPass: t('userData.errorEnterCurrentPassword'),
                          }));
                        }
                        setPasswordModified(true);
                        setPendingChanges!((prev) => ({ ...prev, password: e.target.value }));
                        const validation = validatePassword(e.target.value);
                        if (!validation.isValid) {
                          setPasswordError((prev) => ({ ...prev, newPass: validation.message!.join('\n') }));
                        } else {
                          setPasswordError((prev) => ({ ...prev, newPass: null }));
                        }
                      }}
                    />
                    {passwordModified && (
                      <>
                        <motion.div
                          initial={{ scaleX: 1 }}
                          className={`mt-0.5 h-0.5 w-46 origin-left rounded-full ${passwordError.newPass ? 'bg-tw-alert' : 'bg-tw-success'}`}
                        />
                        <div className='flex flex-col ml-1 pl-3 mt-1 pt-1 border-l border-tw-muted-deep'>
                          <span className='text-tw-muted text-xs uppercase'>{t('userData.repeatPassword')}</span>
                          <input
                            type='password'
                            className={`bg-tw-surface border rounded w-46 px-3 py-1 transition-all focus:outline-none ${
                              passwordError.confirmPass
                                ? 'border-tw-alert/20 focus:border-tw-alert/70 text-tw-alert-highlight focus:text-tw-primary'
                                : 'border-tw-success/20 focus:border-tw-success/70 text-tw-primary'
                            }`}
                            value={passwordData.confirmPassword}
                            placeholder='••••••••'
                            onChange={(e) => {
                              setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                              if (!e.target.value.length) {
                                setPasswordError((prev) => ({
                                  ...prev,
                                  confirmPass: t('userData.errorRewritePassword'),
                                }));
                                setPendingChanges!((prev) => {
                                  const { confirmPassword, ...rest } = prev;
                                  return rest;
                                });
                                return;
                              }
                              setPendingChanges!((prev) => ({ ...prev, confirmPassword: e.target.value }));
                              if (passwordData.password !== e.target.value) {
                                setPasswordError((prev) => ({
                                  ...prev,
                                  confirmPass: t('userData.errorPasswordMismatch'),
                                }));
                              } else {
                                setPasswordError((prev) => ({ ...prev, confirmPass: null }));
                              }
                            }}
                          />

                          {passwordConfigured && (
                            <>
                              <span className='text-tw-muted text-xs uppercase mt-2'>
                                {t('userData.currentPassword')}
                              </span>
                              <input
                                type='password'
                                className={`bg-tw-surface border rounded w-46 px-3 py-1 transition-all focus:outline-none ${
                                  passwordError.currentPass
                                    ? 'border-tw-alert/20 focus:border-tw-alert/70 text-tw-alert-highlight focus:text-tw-primary'
                                    : passwordModified
                                      ? 'border-tw-success/20 focus:border-tw-success/70 text-tw-primary'
                                      : 'border-tw-border focus:border-tw-primary text-tw-primary'
                                }`}
                                value={passwordData.currentPassword}
                                placeholder='••••••••'
                                onChange={(e) => {
                                  setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }));
                                  if (!e.target.value.length) {
                                    setPasswordError((prev) => ({
                                      ...prev,
                                      currentPass: t('userData.errorEnterCurrentPassword'),
                                    }));
                                    setPendingChanges!((prev) => {
                                      const { currentPassword, ...rest } = prev;
                                      return rest;
                                    });
                                    return;
                                  }
                                  setPendingChanges!((prev) => ({ ...prev, currentPassword: e.target.value }));
                                  const validation = validatePassword(e.target.value);
                                  if (!validation.isValid) {
                                    setPasswordError((prev) => ({
                                      ...prev,
                                      currentPass: t('userData.errorInvalidCurrentPassword'),
                                    }));
                                  } else {
                                    setPasswordError((prev) => ({ ...prev, currentPass: null }));
                                  }
                                }}
                              />
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    {Object.values(passwordError).some((e) => e !== null) && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='bg-tw-alert/8 border border-tw-alert/20 text-tw-alert-highlight font-mono text-xs px-3 py-2.5 rounded-lg whitespace-pre-line'>
                        {Object.values(passwordError)
                          .filter((e) => e !== null)
                          .join('\n\n')}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

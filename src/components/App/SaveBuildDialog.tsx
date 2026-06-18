import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface SaveBuildDialogProps {
  showSaveDialog: boolean;
  setShowSaveDialog: (show: boolean) => void;
  saveName: string;
  setSaveName: (name: string) => void;
  handleSaveBuild: () => void;
}

export function SaveBuildDialog({
  showSaveDialog,
  setShowSaveDialog,
  saveName,
  setSaveName,
  handleSaveBuild,
}: SaveBuildDialogProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showSaveDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-tw-base/80 backdrop-blur-2xl'
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSaveDialog(false);
          }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className='relative w-full max-w-sm'>
            <div className='absolute -inset-px rounded-2xl bg-linear-to-br from-tw-glass/12 via-tw-glass/4 to-transparent pointer-events-none' />

            <div className='relative bg-tw-surface/90 backdrop-blur-2xl border border-tw-glass/10 rounded-2xl p-6 flex flex-col gap-4'>
              <div className='absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-tw-glass/8 to-transparent' />

              <div>
                <p className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest mb-1'>
                  {t('saveDialog.title')}
                </p>
                <h3 className='text-tw-primary font-semibold text-sm'>{t('saveDialog.subtitle')}</h3>
              </div>

              <input
                type='text'
                placeholder={t('build.buildPlaceholder')}
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveBuild();
                }}
                autoFocus
                className='font-mono text-xs bg-tw-base border border-tw-glass/10 text-tw-primary placeholder-tw-muted-deep rounded-lg px-4 py-2.5 focus:outline-none focus:border-tw-glass/20 transition-all'
              />

              <div className='flex gap-2'>
                <button
                  onClick={handleSaveBuild}
                  disabled={!saveName.trim()}
                  className='flex-1 font-mono text-xs text-tw-primary bg-tw-base-highlight/8 border border-tw-glass/12 hover:border-tw-glass/25 hover:bg-tw-base-highlight/12 disabled:opacity-25 disabled:cursor-not-allowed py-2.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                  {t('saveDialog.save')}
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveName('');
                  }}
                  className='px-4 font-mono text-xs text-tw-muted border border-tw-glass/8 hover:border-tw-glass/15 hover:text-tw-muted-highlight hover:bg-tw-base-highlight/12 py-2.5 rounded-lg transition-all cursor-pointer'>
                  {t('saveDialog.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

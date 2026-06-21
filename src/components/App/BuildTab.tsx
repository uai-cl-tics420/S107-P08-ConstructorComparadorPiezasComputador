import { Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BuildList } from '@/components/BuildList';
import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { BuildChecklist } from '@/components/BuildChecklist';
import { SavedBuildsPanel } from '@/components/SavedBuildsPanel';
import type { BuildComponent, SavedBuild, Component } from '@/types/Frontend_types';
import type { BuildRecommendations } from '@/utils/recommendations';

interface BuildTabProps {
  compatibilityIssues: { type: 'error' | 'warning'; message: string }[];
  buildComponents: BuildComponent[];
  currentBuildId: string | null;
  setCurrentBuildId: (id: string) => void;
  addToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
  setShowSaveDialog: (show: boolean) => void;
  handleClearBuild: () => void;
  handleRemove: (id: string) => void;
  handleSearchType: (type: string) => void;
  outOfStockIds: Set<string>;
  recommendations: BuildRecommendations | null; // Or import Recommendations type
  recsLoading: boolean;
  handleAdd: (c: Component) => void;
  savedBuilds: SavedBuild[];
  handleLoadBuild: (b: SavedBuild) => void;
  deleteBuild: (id: string) => Promise<void>;
}

export function BuildTab({
  compatibilityIssues,
  buildComponents,
  currentBuildId,
  setCurrentBuildId,
  addToast,
  setShowSaveDialog,
  handleClearBuild,
  handleRemove,
  handleSearchType,
  outOfStockIds,
  recommendations,
  recsLoading,
  handleAdd,
  savedBuilds,
  handleLoadBuild,
  deleteBuild,
}: BuildTabProps) {
  const { t } = useTranslation();

  return (
    <div className='flex flex-col lg:flex-row gap-6'>
      <div className='flex-1 flex flex-col gap-4'>
        {compatibilityIssues.length > 0 && (
          <div className='flex flex-col gap-2'>
            {compatibilityIssues.map((issue, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border font-mono text-xs ${
                  issue.type === 'error'
                    ? 'bg-tw-alert/5 border-tw-alert/15 text-tw-alert-highlight/80'
                    : 'bg-tw-warning/5 border-tw-warbg-tw-warning/15 text-tw-warning-highlight/80'
                }`}>
                <span className='shrink-0 mt-px'>{issue.type === 'error' ? '✕' : '△'}</span>
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}
        <div className='flex items-center justify-between'>
          {buildComponents.length > 0 && (
            <div className='flex gap-2'>
              <button
                onClick={async () => {
                  const baseUrl = window.location.origin;
                  if (currentBuildId) {
                    const shareUrl = `${baseUrl}/?share=${currentBuildId}`;
                    navigator.clipboard
                      .writeText(shareUrl)
                      .then(() => addToast(t('build.linkCopied'), 'success'))
                      .catch(() => addToast(t('build.errorCopyingLink'), 'error'));
                  } else {
                    try {
                      const res = await fetch('/api/shared-builds', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: 'Shared Build', components: buildComponents }),
                      });
                      const data = await res.json();
                      if (data.id) {
                        setCurrentBuildId(data.id);
                        const shareUrl = `${baseUrl}/?share=${data.id}`;
                        navigator.clipboard
                          .writeText(shareUrl)
                          .then(() => addToast(t('build.linkCopied'), 'success'))
                          .catch(() => addToast(t('build.errorCopyingLink'), 'error'));
                      }
                    } catch (err) {
                      addToast(t('build.errorSharingBuild'), 'error');
                    }
                  }
                }}
                className='font-mono flex items-center gap-1.5 text-[0.6rem] text-tw-muted-highlight hover:text-tw-primary border border-tw-glass/10 hover:border-tw-glass/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                <Share2 className='w-3.5 h-3.5' />
                {t('build.share')}
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                className='font-mono text-[0.6rem] text-tw-muted-highlight hover:text-tw-primary border border-tw-glass/10 hover:border-tw-glass/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                {t('build.save')}
              </button>
              <button
                onClick={handleClearBuild}
                className='font-mono text-[0.6rem] text-tw-alert hover:text-tw-alert-highlight border border-tw-alert/15 hover:border-tw-alert/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                {t('build.clear')}
              </button>
            </div>
          )}
        </div>

        <BuildList
          buildComponents={buildComponents}
          onRemove={handleRemove}
          onSearchType={handleSearchType}
          outOfStockIds={outOfStockIds}
        />

        {buildComponents.length > 0 && (
          <RecommendationsPanel recommendations={recommendations} loading={recsLoading} onAdd={handleAdd} />
        )}
      </div>

      <div className='lg:w-64 flex flex-col gap-4'>
        <BuildChecklist build={buildComponents} />
        <SavedBuildsPanel
          savedBuilds={savedBuilds}
          onLoad={handleLoadBuild}
          onDelete={async (id) => {
            try {
              await deleteBuild(id);
              addToast(t('build.buildEliminated'), 'warning');
            } catch {
              addToast(t('build.errorDeleting'), 'error');
            }
          }}
        />
      </div>
    </div>
  );
}

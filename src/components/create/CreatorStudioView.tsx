import React, { useState, useEffect } from 'react';
import {
  CreatorResource,
  CreatorSource,
  CreatorResourceVersion,
  GenerateResourceRequest,
} from '../../types/creator';
import { CreatorClient } from '../../services/creatorClient';
import { AuthClient } from '../../services/authClient';
import { creatorPracticeTransferKey } from '../../utils/creatorPracticeTransfer';
import { SourceIntakePanel } from './SourceIntakePanel';
import { ResourceViewer } from './ResourceViewer';
import { ResourceLibrary } from './ResourceLibrary';
import { SourcesHub } from './SourcesHub';
import { ResourceEditorModal } from './ResourceEditorModal';
import { ExportModal } from './ExportModal';
import {
  Sparkles,
  Layers,
  FolderTree,
  FileText,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { ScreenSkeleton } from '../ui/Skeleton';

import { useAuth } from '../../context/AuthContext';

interface CreatorStudioViewProps {
  onNavigateToPractice?: () => void;
}

export const CreatorStudioView: React.FC<CreatorStudioViewProps> = ({
  onNavigateToPractice,
}) => {
  const { isAuthenticated } = useAuth();
  const [storageStatus, setStorageStatus] = useState('');
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<'synthesizer' | 'library' | 'sources'>('synthesizer');

  // Resources state
  const [resources, setResources] = useState<CreatorResource[]>([]);
  const [activeResource, setActiveResource] = useState<CreatorResource | null>(null);
  const [activeVersions, setActiveVersions] = useState<CreatorResourceVersion[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState<boolean>(true);

  // Sources state
  const [sources, setSources] = useState<CreatorSource[]>([]);
  const [prefillSource, setPrefillSource] = useState<{
    sourceId?: string;
    title?: string;
    extractedText?: string;
    sourceType?: any;
  } | undefined>(undefined);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGenerationLimitReached, setIsGenerationLimitReached] = useState<boolean>(false);
  const [quota, setQuota] = useState<{ sources: any, artifacts: any, urls: any } | null>(null);

  // Modals state
  const [editingResource, setEditingResource] = useState<CreatorResource | null>(null);
  const [exportingResource, setExportingResource] = useState<CreatorResource | null>(null);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState<{
    type: 'resource' | 'source';
    id: string;
  } | null>(null);

  // Alert/Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshSourcesAndQuota = async () => {
    try {
      const [srcList, q] = await Promise.all([
        CreatorClient.getSources(),
        CreatorClient.getQuota(),
      ]);
      setSources(srcList);
      setQuota(q);
      setIsGenerationLimitReached(q.artifacts.isLimitReached);
    } catch {
      // Ignore background refresh failures
    }
  };

  // Load initial resources and sources
  const loadData = async () => {
    setIsLoadingResources(true);
    setLoadError('');
    try {
      const [resList, srcList, q] = await Promise.all([
        CreatorClient.getResources(),
        CreatorClient.getSources(),
        CreatorClient.getQuota(),
      ]);
      setResources(resList);
      setSources(srcList);
      setQuota(q);
      setIsGenerationLimitReached(q.artifacts.isLimitReached);

      // Default active resource if none
      if (!activeResource && resList.length > 0) {
        setActiveResource(resList[0]);
      }
    } catch (err: any) {
      console.warn('Failed loading creator studio data, loading fallback sample assets:', err);
      const fallbackResources: CreatorResource[] = [
        {
          id: 'res-sample-1',
          userId: 'default_user',
          title: 'Calculus & Differential Equations Masterclass',
          resourceType: 'flashcards',
          subjectId: 'math',
          difficulty: 'hard',
          version: 1,
          status: 'ready',
          isPublic: true,
          tags: ['calculus', 'exam-prep'],
          content: {
            flashcards: [
              { id: 'fc-1', front: 'What is the derivative of e^(kx)?', back: 'k * e^(kx)', hint: 'Chain rule' },
              { id: 'fc-2', front: 'State the Fundamental Theorem of Calculus Part 1.', back: 'd/dx int_a^x f(t)dt = f(x)', hint: 'Differentiation of integral' },
            ],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const fallbackSources: CreatorSource[] = [
        {
          id: 'src-sample-1',
          userId: 'default_user',
          title: 'Advanced Calculus Lecture Notes (PDF)',
          sourceType: 'pdf',
          originalContent: 'Calculus primer covering limits, continuity, Taylor series, and vector calculus.',
          extractedText: 'Calculus primer covering limits, continuity, Taylor series, and vector calculus.',
          status: 'ready',
          wordCount: 120,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          fileSize: 1024500,
        },
      ];
      setResources(fallbackResources);
      setSources(fallbackSources);
      setQuota({
        sources: { used: 1, limit: 10, isLimitReached: false },
        artifacts: { used: 1, limit: 20, isLimitReached: false },
        urls: { used: 0, limit: 10, isLimitReached: false },
      });
      if (!activeResource && fallbackResources.length > 0) {
        setActiveResource(fallbackResources[0]);
      }
    } finally {
      setIsLoadingResources(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Fetch full resource details + versions when selecting
  const handleSelectResource = async (res: CreatorResource) => {
    try {
      const detail = await CreatorClient.getResource(res.id);
      setActiveResource(detail.resource);
      setActiveVersions(detail.versions);
      setActiveTab('synthesizer');
    } catch {
      setActiveResource(res);
      setActiveTab('synthesizer');
    }
  };

  // Handle generation pipeline
  const handleGenerate = async (params: GenerateResourceRequest) => {
    setIsGenerating(true);
    try {
      const newResource = await CreatorClient.generateResource(params);
      setResources((prev) => [newResource, ...prev]);
      setActiveResource(newResource);
      setActiveVersions([
        {
          id: `ver-${newResource.id}-1`,
          resourceId: newResource.id,
          versionNumber: 1,
          content: newResource.content,
          changelog: 'Initial synthesis',
          createdAt: newResource.createdAt,
        },
      ]);
      setActiveTab('synthesizer');
      showToast(newResource.tags?.includes('template-generated')
        ? 'AI is unavailable. A template-based draft was created; please review it carefully.'
        : `Successfully synthesized "${newResource.title}"!`);

      // Refresh sources in background
      CreatorClient.getSources().then(setSources).catch(() => {});
    } catch (err: any) {
      if (err.message.includes('429') || err.message.includes('limit reached')) {
        setIsGenerationLimitReached(true);
        showToast('Daily generation limit reached. Please try again tomorrow.', 'error');
      } else {
        showToast(err.message || 'Generation failed.', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete resource
  const handleDeleteResource = (resourceId: string) => {
    setPendingDeleteTarget({ type: 'resource', id: resourceId });
  };

  // Delete source
  const handleDeleteSource = (sourceId: string) => {
    setPendingDeleteTarget({ type: 'source', id: sourceId });
  };

  const confirmPendingDelete = async () => {
    if (!pendingDeleteTarget) return;
    const { type, id } = pendingDeleteTarget;
    setPendingDeleteTarget(null);
    if (type === 'resource') {
      try {
        await CreatorClient.deleteResource(id);
        const remaining = resources.filter((r) => r.id !== id);
        setResources(remaining);
        if (activeResource?.id === id) {
          setActiveResource(remaining.length > 0 ? remaining[0] : null);
        }
        showToast('Resource artifact deleted.');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete resource.', 'error');
      }
    } else {
      try {
        await CreatorClient.deleteSource(id);
        setSources((prev) => prev.filter((s) => s.id !== id));
        showToast('Source document deleted.');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete source.', 'error');
      }
    }
  };

  // Handle re-synthesize from existing source
  const handleSynthesizeFromSource = (source: CreatorSource) => {
    setPrefillSource({
      sourceId: source.id,
      title: source.title,
      extractedText: source.extractedText,
      sourceType: source.sourceType,
    });
    setActiveResource(null);
    setActiveTab('synthesizer');
  };

  // Save edited resource
  const handleSaveResourceEdit = async (updates: any) => {
    if (!editingResource) return;
    try {
      const updated = await CreatorClient.updateResource(editingResource.id, updates);
      setResources((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      if (activeResource?.id === updated.id) {
        setActiveResource(updated);
      }
      showToast(`Updated "${updated.title}" to version ${updated.version}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save edits.', 'error');
      throw err;
    }
  };

  // Add resource to Practice Arena
  const handleAddToPractice = async (res: CreatorResource) => {
    try {
      const accountId = AuthClient.getCurrentUser()?.id;
      const sessionId = AuthClient.getSessionId();
      if (!accountId || !sessionId) throw new Error('Sign in to transfer this resource to practice.');
      const result = await CreatorClient.addToPractice(res.id);
      if (AuthClient.getCurrentUser()?.id !== accountId || AuthClient.getSessionId() !== sessionId) {
        throw new Error('Your session changed before the transfer completed. Please try again.');
      }
      if (result.questions && result.questions.length > 0) {
        localStorage.setItem(
          creatorPracticeTransferKey(accountId),
          JSON.stringify({
            resourceId: res.id,
            resourceTitle: res.title,
            subjectId: res.subjectId,
            questions: result.questions,
            timestamp: Date.now(),
          })
        );
      }
      showToast(result.message || 'Transferred to Practice Arena! Redirecting...');
      if (onNavigateToPractice) {
        setTimeout(() => {
          if (AuthClient.getCurrentUser()?.id === accountId && AuthClient.getSessionId() === sessionId) onNavigateToPractice();
        }, 500);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to transfer to practice.', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {storageStatus && (
        <div role="status" className="p-4 rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] text-xs text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center justify-between gap-2">
          <span>{storageStatus} Firebase copies are retained separately when a local source is deleted.</span>
          <button type="button" onClick={() => setStorageStatus('')} className="min-h-[44px] px-3 underline cursor-pointer">Dismiss</button>
        </div>
      )}
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm text-xs font-semibold animate-in slide-in-from-top duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-[#4CAF8E] text-white border-[#4CAF8E]'
              : 'bg-[#F25F5C] text-white border-[#F25F5C]'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="min-h-[44px] px-2 text-white/90 hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Creator Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Create
            </Badge>
            {quota && (
              <Badge variant="outline" size="sm">
                Uploads: {quota.sources.used}/{quota.sources.limit} · Artifacts: {quota.artifacts.used}/{quota.artifacts.limit}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
            Create
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6890] dark:text-[#B4B0D5]">
            Turn syllabus PDFs, links, or study notes into flashcards, summaries, and practice quizzes.
          </p>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex bg-[#FFFFFF] dark:bg-[#2A2647] p-1 rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] overflow-x-auto max-w-full scrollbar-none w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('synthesizer')}
            className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'synthesizer'
                ? 'bg-[#6C5CE7] dark:bg-[#8577ED] text-white shadow-xs'
                : 'text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'library'
                ? 'bg-[#6C5CE7] dark:bg-[#8577ED] text-white shadow-xs'
                : 'text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Library ({resources.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'sources'
                ? 'bg-[#6C5CE7] dark:bg-[#8577ED] text-white shadow-xs'
                : 'text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Sources ({sources.length})</span>
          </button>
        </div>
      </div>

      {isLoadingResources ? (
        <ScreenSkeleton label="Loading Creator Studio artifacts and sources..." />
      ) : loadError ? (
        <EmptyState
          variant="error"
          icon={<AlertCircle className="w-6 h-6" />}
          title="Could not load Create studio"
          description={loadError}
          action={
            <Button type="button" variant="primary" size="md" onClick={loadData} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retry
            </Button>
          }
        />
      ) : (
        <>
          {/* TAB CONTENT: STUDIO SYNTHESIZER */}
          {activeTab === 'synthesizer' && (
            <div className="space-y-8">
              {activeResource ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setActiveResource(null)}
                      leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    >
                      New Synthesis
                    </Button>

                    <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                      Viewing Active Synthesized Artifact
                    </span>
                  </div>

                  <ResourceViewer
                    resource={activeResource}
                    versions={activeVersions}
                    onEdit={(res) => setEditingResource(res)}
                    onDelete={handleDeleteResource}
                    onExport={(res) => setExportingResource(res)}
                    onAddToPractice={handleAddToPractice}
                    onSelectVersion={(ver) => {
                      setActiveResource((prev) =>
                        prev
                          ? {
                              ...prev,
                              version: ver.versionNumber,
                              content: ver.content,
                            }
                          : null
                      );
                    }}
                  />
                </div>
              ) : (
                <SourceIntakePanel
                  onGenerate={handleGenerate}
                  onStorageStatus={setStorageStatus}
                  onSourceSaved={refreshSourcesAndQuota}
                  isGenerating={isGenerating}
                  isGenerationLimitReached={isGenerationLimitReached}
                  prefillSource={prefillSource}
                />
              )}
            </div>
          )}

          {/* TAB CONTENT: RESOURCE LIBRARY */}
          {activeTab === 'library' && (
            <ResourceLibrary
              resources={resources}
              onSelectResource={handleSelectResource}
              onEditResource={(res) => setEditingResource(res)}
              onDeleteResource={handleDeleteResource}
              onExportResource={(res) => setExportingResource(res)}
              onAddToPractice={handleAddToPractice}
              onCreateNew={() => {
                setActiveResource(null);
                setPrefillSource(undefined);
                setActiveTab('synthesizer');
              }}
            />
          )}

          {/* TAB CONTENT: SOURCES HUB */}
          {activeTab === 'sources' && (
            <SourcesHub
              sources={sources}
              onSynthesizeFromSource={handleSynthesizeFromSource}
              onDeleteSource={handleDeleteSource}
              onCreateNewSource={() => {
                setActiveResource(null);
                setPrefillSource(undefined);
                setActiveTab('synthesizer');
              }}
            />
          )}
        </>
      )}

      {/* Modals */}
      {editingResource && (
        <ResourceEditorModal
          resource={editingResource}
          isOpen={!!editingResource}
          onClose={() => setEditingResource(null)}
          onSave={handleSaveResourceEdit}
        />
      )}

      {exportingResource && (
        <ExportModal
          resource={exportingResource}
          isOpen={!!exportingResource}
          onClose={() => setExportingResource(null)}
        />
      )}

      {pendingDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-[#2D2A4A]/70 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
              {pendingDeleteTarget.type === 'resource' ? 'Delete Resource Artifact?' : 'Delete Source Document?'}
            </h3>
            <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
              This action permanently removes the selected {pendingDeleteTarget.type} from your studio library.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPendingDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmPendingDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

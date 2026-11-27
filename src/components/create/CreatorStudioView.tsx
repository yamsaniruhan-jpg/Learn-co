import React, { useState, useEffect } from 'react';
import {
  CreatorResource,
  CreatorSource,
  CreatorResourceVersion,
  GenerateResourceRequest,
} from '../../types/creator';
import { CreatorClient } from '../../services/creatorClient';
import { AuthClient } from '../../services/authClient';
import {
  creatorPracticeTransferKey,
  writeGuestCreatorPracticeTransfer,
} from '../../utils/creatorPracticeTransfer';
import {
  canConsumeGuestQuota,
  consumeGuestQuota,
  extractTextFromFileClient,
  generateGuestCreatorResource,
  getGuestQuotaRemaining,
  GUEST_LIMITS,
  GUEST_QUOTA_UPDATED_EVENT,
} from '../../utils/guestMode';
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
  const [creationAuthError, setCreationAuthError] = useState<string | null>(null);
  const [pendingRetryRequest, setPendingRetryRequest] = useState<{
    params: GenerateResourceRequest;
    file?: File | null;
  } | null>(null);

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

  const applySampleGuestWorkspace = () => {
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
    const guestState = getGuestQuotaRemaining().state;
    const isGuestCapHit = guestState.creationsUsed >= GUEST_LIMITS.creations;
    setResources((prev) => (prev.some((r) => r.id.startsWith('res-guest-')) ? prev : fallbackResources));
    setSources(fallbackSources);
    setQuota({
      sources: { used: 0, limit: 2, isLimitReached: false },
      artifacts: { used: guestState.creationsUsed, limit: GUEST_LIMITS.creations, isLimitReached: isGuestCapHit },
      urls: { used: 0, limit: 2, isLimitReached: false },
    });
    setIsGenerationLimitReached(isGuestCapHit);
    setActiveResource((prev) => prev || fallbackResources[0]);
  };

  // Load initial resources and sources
  const loadData = async () => {
    setIsLoadingResources(true);
    setLoadError('');
    if (!isAuthenticated || !AuthClient.hasSession()) {
      applySampleGuestWorkspace();
      setIsLoadingResources(false);
      return;
    }

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

      if (!activeResource && resList.length > 0) {
        setActiveResource(resList[0]);
      }
    } catch {
      applySampleGuestWorkspace();
    } finally {
      setIsLoadingResources(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && AuthClient.hasSession()) return;
    const syncGuestQuota = () => {
      const { state } = getGuestQuotaRemaining();
      const hit = state.creationsUsed >= GUEST_LIMITS.creations;
      setIsGenerationLimitReached(hit);
      setQuota({
        sources: { used: 0, limit: 2, isLimitReached: false },
        artifacts: { used: state.creationsUsed, limit: GUEST_LIMITS.creations, isLimitReached: hit },
        urls: { used: 0, limit: 2, isLimitReached: false },
      });
    };
    window.addEventListener(GUEST_QUOTA_UPDATED_EVENT, syncGuestQuota);
    return () => window.removeEventListener(GUEST_QUOTA_UPDATED_EVENT, syncGuestQuota);
  }, [isAuthenticated]);

  // Fetch full resource details + versions when selecting
  const handleSelectResource = async (res: CreatorResource) => {
    if (!AuthClient.hasSession() || res.id.startsWith('res-guest-') || res.id.startsWith('res-sample-')) {
      setActiveResource(res);
      setActiveVersions([]);
      setActiveTab('synthesizer');
      return;
    }
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

  const handleGuestGenerate = async (params: GenerateResourceRequest, file?: File | null) => {
    if (!canConsumeGuestQuota('creations', 1)) {
      setIsGenerationLimitReached(true);
      setCreationAuthError(null);
      setPendingRetryRequest(null);
      showToast(
        `Guest creation limit reached (${GUEST_LIMITS.creations}/${GUEST_LIMITS.creations} PDFs/resources used). Sign in to unlock 20/day + permanent library.`,
        'error'
      );
      return;
    }
    setIsGenerating(true);
    try {
      let sourceText = params.sourceText;
      if (file && !sourceText) {
        sourceText = await extractTextFromFileClient(file);
      }
      const nextState = consumeGuestQuota('creations', 1);
      const guestResource = generateGuestCreatorResource({ ...params, sourceText });
      setResources((prev) => [guestResource, ...prev]);
      setActiveResource(guestResource);
      setActiveVersions([
        {
          id: `ver-${guestResource.id}-1`,
          resourceId: guestResource.id,
          versionNumber: 1,
          content: guestResource.content,
          changelog: 'Guest ephemeral synthesis',
          createdAt: guestResource.createdAt,
        },
      ]);
      setCreationAuthError(null);
      setPendingRetryRequest(null);
      setQuota({
        sources: { used: 0, limit: 2, isLimitReached: false },
        artifacts: {
          used: nextState.creationsUsed,
          limit: GUEST_LIMITS.creations,
          isLimitReached: nextState.creationsUsed >= GUEST_LIMITS.creations,
        },
        urls: { used: 0, limit: 2, isLimitReached: false },
      });
      setIsGenerationLimitReached(nextState.creationsUsed >= GUEST_LIMITS.creations);
      setActiveTab('synthesizer');
      showToast('Created in Guest Mode (nothing saved). Export or Save/Print Clean PDF below.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle generation pipeline
  const handleGenerate = async (params: GenerateResourceRequest) => {
    setCreationAuthError(null);
    setPendingRetryRequest(null);

    if (!AuthClient.hasSession()) {
      setPendingRetryRequest({ params, file: null });
      setCreationAuthError(
        `Authentication required to save PDFs and resources to your library. Press Retry below to generate ephemerally in Guest Mode (up to ${GUEST_LIMITS.creations} resources, nothing saved).`
      );
      return;
    }

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

      CreatorClient.getSources().then(setSources).catch(() => {});
    } catch (err: any) {
      const msg = err?.message || 'Generation failed.';
      if (/401|auth|sign in|unauthorized/i.test(msg)) {
        setPendingRetryRequest({ params, file: null });
        setCreationAuthError(
          `Authentication required to save PDFs and resources to your library. Press Retry below to generate ephemerally in Guest Mode (up to ${GUEST_LIMITS.creations} resources, nothing saved).`
        );
      } else if (msg.includes('429') || msg.includes('limit reached')) {
        setIsGenerationLimitReached(true);
        showToast('Daily generation limit reached. Please try again tomorrow.', 'error');
      } else {
        showToast(msg, 'error');
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
      if (!accountId || !sessionId) {
        const guestQuestions: any[] = [];
        if (Array.isArray(res.content?.quiz) && res.content.quiz.length > 0) {
          res.content.quiz.forEach((q: any, idx: number) => {
            const opts = Array.isArray(q.options) && q.options.length > 0 ? q.options : ['True', 'False'];
            const correctIdx = typeof q.correctIndex === 'number' && opts[q.correctIndex] ? q.correctIndex : 0;
            guestQuestions.push({
              id: q.id || `guest-xfer-q-${idx + 1}`,
              subjectId: res.subjectId,
              topicId: res.title,
              questionType: 'single_choice',
              difficulty: res.difficulty || 'medium',
              bloomLevel: q.bloomLevel || 'Understand',
              questionText: q.question,
              options: opts,
              correctAnswer: opts[correctIdx],
              explanation: q.explanation || res.title,
              examTracks: ['all'],
            });
          });
        } else if (Array.isArray(res.content?.flashcards) && res.content.flashcards.length > 0) {
          res.content.flashcards.slice(0, 5).forEach((fc: any, idx: number) => {
            guestQuestions.push({
              id: fc.id || `guest-xfer-fc-${idx + 1}`,
              subjectId: res.subjectId,
              topicId: res.title,
              questionType: 'single_choice',
              difficulty: res.difficulty || 'medium',
              bloomLevel: 'Remember',
              questionText: fc.front,
              options: [
                fc.back,
                'Depends only on boundary constants outside the system.',
                'Does not satisfy invariance principles.',
                'Insufficient information without numerical approximation.',
              ],
              correctAnswer: fc.back,
              explanation: fc.back,
              hints: fc.hint ? [fc.hint] : undefined,
              examTracks: ['all'],
            });
          });
        } else if (Array.isArray(res.content?.worksheet?.problems) && res.content.worksheet.problems.length > 0) {
          res.content.worksheet.problems.slice(0, 5).forEach((prob: any, idx: number) => {
            guestQuestions.push({
              id: prob.id || `guest-xfer-ws-${idx + 1}`,
              subjectId: res.subjectId,
              topicId: res.title,
              questionType: 'single_choice',
              difficulty: res.difficulty || 'medium',
              bloomLevel: 'Apply',
              questionText: prob.prompt,
              options: [
                prob.solution,
                'Only holds when all terms equal zero.',
                'Requires negating every governing coefficient.',
                'Undefined outside discrete intervals.',
              ],
              correctAnswer: prob.solution,
              explanation: prob.solution,
              hints: prob.hint ? [prob.hint] : undefined,
              examTracks: ['all'],
            });
          });
        }

        if (guestQuestions.length === 0) {
          throw new Error('Generate a quiz, flashcard deck, or worksheet to practice these items.');
        }

        writeGuestCreatorPracticeTransfer({
          resourceId: res.id,
          resourceTitle: res.title,
          subjectId: res.subjectId,
          questions: guestQuestions.slice(0, GUEST_LIMITS.practiceQuestions),
          timestamp: Date.now(),
        });
        showToast('Transferred to Practice Arena for Guest preview (nothing saved)...');
        if (onNavigateToPractice) {
          setTimeout(() => onNavigateToPractice(), 350);
        }
        return;
      }

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
        <div className="flex bg-[#FFFFFF] dark:bg-[#111114] p-1 rounded-2xl border border-[#E3DFF5] dark:border-[#232329] overflow-x-auto max-w-full scrollbar-none w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('synthesizer')}
            className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'synthesizer'
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'text-[#6B6890] dark:text-[#9D9BB8] hover:text-[#2D2A4A] dark:hover:text-white'
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
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'text-[#6B6890] dark:text-[#9D9BB8] hover:text-[#2D2A4A] dark:hover:text-white'
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
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'text-[#6B6890] dark:text-[#9D9BB8] hover:text-[#2D2A4A] dark:hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Sources ({sources.length})</span>
          </button>
        </div>
      </div>

      {creationAuthError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-200 font-semibold"
        >
          <span>{creationAuthError}</span>
          {pendingRetryRequest && (
            <button
              type="button"
              onClick={() => handleGuestGenerate(pendingRetryRequest.params, pendingRetryRequest.file)}
              disabled={isGenerating}
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#CCFF00] hover:bg-[#B8E600] text-[#09090B] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry &amp; Generate in Guest Mode (Not Saved)</span>
            </button>
          )}
        </div>
      )}

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

                    <span className="text-xs text-[#6B6890] dark:text-[#9D9BB8]">
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
                  onGuestFallbackGenerate={handleGuestGenerate}
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
        <div className="fixed inset-0 z-50 bg-[#09090B]/70 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-[#2D2A4A] dark:text-white">
              {pendingDeleteTarget.type === 'resource' ? 'Delete Resource Artifact?' : 'Delete Source Document?'}
            </h3>
            <p className="text-xs text-[#6B6890] dark:text-[#9D9BB8] leading-relaxed">
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

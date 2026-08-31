import React, { useState, useEffect } from 'react';
import {
  CreatorResource,
  CreatorSource,
  CreatorResourceVersion,
  GenerateResourceRequest,
} from '../../types/creator';
import { CreatorClient } from '../../services/creatorClient';
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

export const CreatorStudioView: React.FC = () => {
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

  // Modals state
  const [editingResource, setEditingResource] = useState<CreatorResource | null>(null);
  const [exportingResource, setExportingResource] = useState<CreatorResource | null>(null);

  // Alert/Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load initial resources and sources
  const loadData = async () => {
    setIsLoadingResources(true);
    try {
      const [resList, srcList] = await Promise.all([
        CreatorClient.getResources(),
        CreatorClient.getSources(),
      ]);
      setResources(resList);
      setSources(srcList);

      // Default active resource if none
      if (!activeResource && resList.length > 0) {
        setActiveResource(resList[0]);
      }
    } catch (err: any) {
      console.warn('Failed loading creator studio data:', err);
    } finally {
      setIsLoadingResources(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      showToast(`Successfully synthesized "${newResource.title}"!`);

      // Refresh sources in background
      CreatorClient.getSources().then(setSources).catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Generation failed.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete resource
  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this resource artifact?')) {
      return;
    }
    try {
      await CreatorClient.deleteResource(resourceId);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      if (activeResource?.id === resourceId) {
        const remaining = resources.filter((r) => r.id !== resourceId);
        setActiveResource(remaining.length > 0 ? remaining[0] : null);
      }
      showToast('Resource artifact deleted.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete resource.', 'error');
    }
  };

  // Delete source
  const handleDeleteSource = async (sourceId: string) => {
    if (!window.confirm('Delete this source document?')) return;
    try {
      await CreatorClient.deleteSource(sourceId);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      showToast('Source document deleted.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete source.', 'error');
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
      const result = await CreatorClient.addToPractice(res.id);
      showToast(result.message);
    } catch (err: any) {
      showToast(err.message || 'Failed to transfer to practice.', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-lg text-xs font-semibold animate-in slide-in-from-top duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
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
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Creator Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Volume 4 • AI Pedagogical Synthesis</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
            Creator Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Ingest syllabus PDFs, lecture notes, or research papers and synthesize structured interactive artifacts.
          </p>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              setActiveTab('synthesizer');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'synthesizer'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'library'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>My Library ({resources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'sources'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Sources ({sources.length})</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: STUDIO SYNTHESIZER */}
      {activeTab === 'synthesizer' && (
        <div className="space-y-8">
          {activeResource ? (
            <div className="space-y-6">
              {/* Back to Intake Button */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveResource(null)}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Synthesize Another Resource
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    Viewing Active Synthesized Artifact
                  </span>
                </div>
              </div>

              {/* Master Resource Viewer */}
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
              isGenerating={isGenerating}
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
    </div>
  );
};

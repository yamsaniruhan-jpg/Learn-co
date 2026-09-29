import React, { useState, useEffect } from 'react';
import {
  ChapterArchiveResource,
  DIGITAL_ARCHIVE_RESOURCES,
} from '../../data/digitalArchiveData';
import {
  CitationItem,
  parseAuthors,
  generateAPACitation,
  generateMLACitation,
  generateChicagoCitation,
  generateIEEECitation,
  generateBibTeX,
  generateRIS,
  loadZoteroConfig,
  saveZoteroConfig,
  pushItemToZotero,
  downloadCitationFile,
  fetchZoteroCollections,
  DEFAULT_STEM_COLLECTIONS,
  ZoteroConfig,
  ZoteroCollection,
} from '../../utils/citationUtils';
import {
  BookOpen,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Layers,
  Sparkles,
  Key,
  ShieldCheck,
  Send,
  FileCode,
  FileText,
  Bookmark,
  X,
  RefreshCw,
  AlertCircle,
  Database,
  FolderPlus,
  Folder,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface ZoteroCitationModalProps {
  resource: ChapterArchiveResource | null;
  isOpen: boolean;
  onClose: () => void;
  onAskCopilotToSynthesize?: (prompt: string) => void;
}

export const ZoteroCitationModal: React.FC<ZoteroCitationModalProps> = ({
  resource,
  isOpen,
  onClose,
  onAskCopilotToSynthesize,
}) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'bibtex' | 'ris' | 'zotero_sync' | 'batch'>(
    'standard'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [zoteroConfig, setZoteroConfig] = useState<ZoteroConfig>(loadZoteroConfig);
  const [collections, setCollections] = useState<ZoteroCollection[]>(DEFAULT_STEM_COLLECTIONS);
  const [selectedCollectionKey, setSelectedCollectionKey] = useState<string>(
    zoteroConfig.selectedCollectionKey || 'col_stem_all'
  );
  const [isLoadingCollections, setIsLoadingCollections] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  const loadCollections = async (cfg: ZoteroConfig) => {
    setIsLoadingCollections(true);
    try {
      const res = await fetchZoteroCollections(cfg);
      if (res.collections && res.collections.length > 0) {
        setCollections(res.collections);
      }
    } catch {
      setCollections(DEFAULT_STEM_COLLECTIONS);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const cfg = loadZoteroConfig();
      setZoteroConfig(cfg);
      setSelectedCollectionKey(cfg.selectedCollectionKey || 'col_stem_all');
      setSyncStatus({ loading: false });
      setCopiedKey(null);
      loadCollections(cfg);
    }
  }, [isOpen]);

  if (!isOpen || !resource) return null;

  // Build standard CitationItem model from ChapterArchiveResource
  const authorsList = parseAuthors(resource.authors);
  const yearMatch = resource.editionOrYear?.match(/\d{4}/);
  const publicationYear = yearMatch ? parseInt(yearMatch[0], 10) : 2024;
  const doi = `10.1000/stem.${resource.subjectId}.${resource.chapterId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const isbn = '978-0-134-68894-7';

  const citationItem: CitationItem = {
    id: resource.id,
    itemType: 'bookSection',
    title: resource.chapterTitle,
    bookTitle: resource.bookTitle,
    authors: authorsList,
    publisher: 'STEM Pedagogical Archives & Academic Press',
    publicationYear,
    doi,
    isbn,
    abstractNote: resource.description,
    tags: [resource.subjectId, resource.level, ...resource.keyTopicsCovered.slice(0, 3)],
    collections: selectedCollectionKey !== 'col_stem_all' ? [selectedCollectionKey] : undefined,
  };

  const apa = generateAPACitation(citationItem);
  const mla = generateMLACitation(citationItem);
  const chicago = generateChicagoCitation(citationItem);
  const ieee = generateIEEECitation(citationItem, 1);
  const bibtex = generateBibTeX(citationItem);
  const ris = generateRIS(citationItem);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveZoteroConfig = () => {
    const updated = { ...zoteroConfig, selectedCollectionKey };
    saveZoteroConfig(updated);
    setZoteroConfig(updated);
    loadCollections(updated);
    setSyncStatus({
      loading: false,
      success: true,
      message: 'Zotero credentials and default collection preferences saved securely.',
    });
    setTimeout(() => setSyncStatus({ loading: false }), 3000);
  };

  const handleSyncToZotero = async () => {
    if (!zoteroConfig.apiKey || !zoteroConfig.userId) {
      setSyncStatus({
        loading: false,
        success: false,
        message: 'Please fill in both Zotero User ID and API Key to authenticate.',
      });
      return;
    }

    setSyncStatus({ loading: true });
    const updated = { ...zoteroConfig, selectedCollectionKey };
    saveZoteroConfig(updated);

    const result = await pushItemToZotero(citationItem, updated, selectedCollectionKey);
    setSyncStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });
  };

  const handleBatchDownloadBib = () => {
    const allItems: string[] = DIGITAL_ARCHIVE_RESOURCES.map((r) => {
      const auth = parseAuthors(r.authors);
      const ym = r.editionOrYear?.match(/\d{4}/);
      const yr = ym ? parseInt(ym[0], 10) : 2024;
      const it: CitationItem = {
        id: r.id,
        itemType: 'bookSection',
        title: r.chapterTitle,
        bookTitle: r.bookTitle,
        authors: auth,
        publisher: 'STEM Pedagogical Archives & Academic Press',
        publicationYear: yr,
        doi: `10.1000/stem.${r.subjectId}.${r.chapterId.replace(/[^a-zA-Z0-9]/g, '')}`,
        abstractNote: r.description,
        tags: [r.subjectId, r.level, ...r.keyTopicsCovered.slice(0, 3)],
      };
      return generateBibTeX(it);
    });

    const fullContent = `% Stem Master Curriculum & Textbook Archive Bibliography\n% Exported from LearnCo Platform\n\n${allItems.join('\n\n')}`;
    downloadCitationFile('stem-archive-curriculum.bib', fullContent, 'application/x-bibtex');
  };

  const handleBatchDownloadRIS = () => {
    const allItems: string[] = DIGITAL_ARCHIVE_RESOURCES.map((r) => {
      const auth = parseAuthors(r.authors);
      const ym = r.editionOrYear?.match(/\d{4}/);
      const yr = ym ? parseInt(ym[0], 10) : 2024;
      const it: CitationItem = {
        id: r.id,
        itemType: 'bookSection',
        title: r.chapterTitle,
        bookTitle: r.bookTitle,
        authors: auth,
        publisher: 'STEM Pedagogical Archives & Academic Press',
        publicationYear: yr,
        doi: `10.1000/stem.${r.subjectId}.${r.chapterId.replace(/[^a-zA-Z0-9]/g, '')}`,
        abstractNote: r.description,
        tags: [r.subjectId, r.level, ...r.keyTopicsCovered.slice(0, 3)],
      };
      return generateRIS(it);
    });

    const fullContent = allItems.join('\n\n');
    downloadCitationFile('stem-archive-curriculum.ris', fullContent, 'application/x-research-info-systems');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/30">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 shrink-0">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Zotero & Citation Suite
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  DOI: {doi}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                {resource.chapterTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {resource.bookTitle} • by {resource.authors}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
          {[
            { id: 'standard', label: 'Standard Citations', icon: FileText },
            { id: 'bibtex', label: 'BibTeX / LaTeX', icon: FileCode },
            { id: 'ris', label: 'RIS / EndNote', icon: Database },
            { id: 'zotero_sync', label: 'Zotero Cloud & Collections', icon: Share2 },
            { id: 'batch', label: 'Batch Export Library', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-xs'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-slate-100">
          {/* TAB 1: Standard Citations */}
          {activeTab === 'standard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Academic Formats (1-Click Copy)
                </span>
                <span className="text-[11px] text-slate-400">
                  Formatted in standard style guide conventions
                </span>
              </div>

              {[
                { label: 'APA 7th Edition', text: apa, key: 'apa' },
                { label: 'MLA 9th Edition', text: mla, key: 'mla' },
                { label: 'Chicago 17th Edition (Author-Date)', text: chicago, key: 'chicago' },
                { label: 'IEEE Format', text: ieee, key: 'ieee' },
              ].map((style) => (
                <div
                  key={style.key}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {style.label}
                    </span>
                    <button
                      onClick={() => handleCopy(style.text, style.key)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-700 dark:text-slate-200 transition-all shadow-xs cursor-pointer"
                    >
                      {copiedKey === style.key ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-serif leading-relaxed select-all">
                    {style.text}
                  </p>
                </div>
              ))}

              {onAskCopilotToSynthesize && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Synthesize Literature Review with Socratic Copilot
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Generate a formal academic paragraph explaining the theoretical significance of this chapter.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onAskCopilotToSynthesize(
                        `Write a rigorous academic literature review paragraph citing "${resource.chapterTitle}" by ${resource.authors} in ${resource.bookTitle}, focusing on key invariants: ${resource.keyTopicsCovered.join(', ')}.`
                      );
                    }}
                    className="text-xs shrink-0"
                  >
                    Ask Copilot
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BibTeX & LaTeX */}
          {activeTab === 'bibtex' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  BibTeX Entry for LaTeX Documents (.bib)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(bibtex, 'bibtex')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedKey === 'bibtex' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy BibTeX</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      downloadCitationFile(
                        `${resource.chapterId}.bib`,
                        bibtex,
                        'application/x-bibtex'
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .bib</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed select-all">
                {bibtex}
              </pre>

              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  LaTeX Usage Guide:
                </p>
                <p>
                  Include in your main document via <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">\cite{'{'}{resource.authors.split(' ')[0].toLowerCase()}24{'}'}</code> with BibLaTeX or standard BibTeX.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: RIS & Reference Managers */}
          {activeTab === 'ris' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  RIS Format (Compatible with Zotero, Mendeley, EndNote)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(ris, 'ris')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedKey === 'ris' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy RIS</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      downloadCitationFile(
                        `${resource.chapterId}.ris`,
                        ris,
                        'application/x-research-info-systems'
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .ris</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed select-all">
                {ris}
              </pre>
            </div>
          )}

          {/* TAB 4: Zotero Cloud Sync & Collection Subfolders */}
          {activeTab === 'zotero_sync' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  <Share2 className="w-4 h-4" />
                  <span>Direct Zotero Web API v3 Integration with Collection Subfolders</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Save chapters, theorems, and citation metadata directly to your personal or group Zotero library and target specific collection subfolders in the cloud. Get your API Key from{' '}
                  <a
                    href="https://www.zotero.org/settings/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    zotero.org/settings/keys
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>.
                </p>
              </div>

              {syncStatus.message && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    syncStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {syncStatus.success ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{syncStatus.message}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Zotero User ID / Group ID
                    </label>
                    <input
                      type="text"
                      value={zoteroConfig.userId}
                      onChange={(e) =>
                        setZoteroConfig((prev) => ({ ...prev, userId: e.target.value.trim() }))
                      }
                      placeholder="e.g. 1234567"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Library Type
                    </label>
                    <select
                      value={zoteroConfig.libraryType}
                      onChange={(e) =>
                        setZoteroConfig((prev) => ({
                          ...prev,
                          libraryType: e.target.value as 'user' | 'group',
                        }))
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="user">User Library (Personal)</option>
                      <option value="group">Group Library</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Zotero API Key (Read/Write Access)
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={zoteroConfig.apiKey}
                      onChange={(e) =>
                        setZoteroConfig((prev) => ({ ...prev, apiKey: e.target.value.trim() }))
                      }
                      placeholder="e.g. AbC123XyZ456..."
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Target Collection Subfolder Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Target Zotero Collection Subfolder
                    </label>
                    <button
                      onClick={() => loadCollections(zoteroConfig)}
                      disabled={isLoadingCollections}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingCollections ? 'animate-spin' : ''}`} />
                      <span>{isLoadingCollections ? 'Refreshing...' : 'Refresh Collections'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <Folder className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={selectedCollectionKey}
                      onChange={(e) => setSelectedCollectionKey(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {collections.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.name} {col.numItems ? `(${col.numItems} items)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleSaveZoteroConfig}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Save Preferences in Browser
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSyncToZotero}
                    disabled={syncStatus.loading}
                    leftIcon={
                      syncStatus.loading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )
                    }
                    className="text-xs"
                  >
                    {syncStatus.loading ? 'Syncing to Zotero...' : 'Push to Selected Collection'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Batch Export Full Curriculum */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <span>Curated STEM Reference Library ({DIGITAL_ARCHIVE_RESOURCES.length} Chapters)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Export the entire curated textbook and paper catalog across Mathematics, Computer Science, Physics, Chemistry, and Biology in a single comprehensive bibliography package.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <FileCode className="w-4 h-4 text-indigo-500" />
                    <span>Complete BibLaTeX Package</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Downloads a master <code className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">stem-archive-curriculum.bib</code> file with all {DIGITAL_ARCHIVE_RESOURCES.length} curated chapters and DOI references.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleBatchDownloadBib}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download Master .BIB
                  </Button>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <Database className="w-4 h-4 text-purple-500" />
                    <span>Complete RIS / EndNote Archive</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Downloads a master <code className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">stem-archive-curriculum.ris</code> file ready for direct drag-and-drop into Zotero desktop or web.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleBatchDownloadRIS}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download Master .RIS
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Open STEM Invariant Citation Index
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Citation Suite
          </Button>
        </div>
      </div>
    </div>
  );
};

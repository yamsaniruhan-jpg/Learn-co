import React, { useState } from 'react';
import { CreatorSource } from '../../types/creator';
import {
  FileText,
  UploadCloud,
  Globe,
  Trash2,
  Sparkles,
  ExternalLink,
  Search,
  Plus,
  File,
  Bookmark,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { generateBibTeX, CitationItem } from '../../utils/citationUtils';

interface SourcesHubProps {
  sources: CreatorSource[];
  onSynthesizeFromSource: (source: CreatorSource) => void;
  onDeleteSource: (sourceId: string) => void;
  onCreateNewSource: () => void;
}

export const SourcesHub: React.FC<SourcesHubProps> = ({
  sources,
  onSynthesizeFromSource,
  onDeleteSource,
  onCreateNewSource,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSources = sources.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.title.toLowerCase().includes(q) ||
      s.extractedText.toLowerCase().includes(q) ||
      (s.fileName && s.fileName.toLowerCase().includes(q))
    );
  });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <UploadCloud className="w-4 h-4 text-rose-500" />;
      case 'url':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'text':
      default:
        return <FileText className="w-4 h-4 text-indigo-500" />;
    }
  };

  const handleCopyBibtex = (source: CreatorSource) => {
    const item: CitationItem = {
      id: source.id,
      itemType: source.sourceType === 'url' ? 'report' : 'bookSection',
      title: source.title,
      authors: ['LearnCo Academic Creator Archive'],
      publicationYear: new Date(source.createdAt).getFullYear() || 2024,
      abstractNote: source.extractedText.slice(0, 200),
      tags: ['CreatorSource', source.sourceType],
    };
    const bib = generateBibTeX(item);
    navigator.clipboard.writeText(bib);
    setCopiedId(source.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ingested source documents, PDFs or lecture notes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onCreateNewSource}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          Ingest New Document
        </Button>
      </div>

      {/* Grid of Sources */}
      {filteredSources.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Ingested Sources Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload PDFs, paste lecture notes, or import references into your personal STEM knowledge hub.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateNewSource}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Ingest First Source
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSources.map((source) => (
            <div
              key={source.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {getSourceIcon(source.sourceType)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {source.sourceType.toUpperCase()} SOURCE
                    </span>
                  </div>
                  <Badge variant="default" size="sm">
                    {source.wordCount} words
                  </Badge>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {source.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg font-mono text-[11px]">
                  {source.extractedText}
                </p>
              </div>

              {/* Source Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSynthesizeFromSource(source)}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Synthesize
                </Button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyBibtex(source)}
                    className="p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Copy BibTeX Citation"
                  >
                    {copiedId === source.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Bookmark className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteSource(source.id)}
                    className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Remove Source"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { CreatorResource } from '../../types/creator';
import {
  X,
  Download,
  Copy,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  Bookmark,
  Share2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { resourceToPlainText } from '../../utils/textSanitizer';

interface ExportModalProps {
  resource: CreatorResource;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  resource,
  isOpen,
  onClose,
}) => {
  const [format, setFormat] = useState<'normal' | 'markdown' | 'json'>('normal');
  const [copied, setCopied] = useState<boolean>(false);
  const [savedLocally, setSavedLocally] = useState<boolean>(false);

  if (!isOpen) return null;

  const normalText = resourceToPlainText(resource);

  const generateMarkdown = (): string => {
    let md = `# ${resource.title}\n\n`;
    md += `**Subject**: ${resource.subjectId.toUpperCase()} | **Difficulty**: ${resource.difficulty} | **Version**: v${resource.version}\n\n---\n\n`;

    if (resource.resourceType === 'slides' && resource.content.slides) {
      resource.content.slides.forEach((s: any, idx: number) => {
        md += `## Slide ${idx + 1}: ${s.title}\n\n`;
        if (s.subtitle) md += `*${s.subtitle}*\n\n`;
        if (s.bullets) {
          s.bullets.forEach((b: string) => {
            md += `* ${b}\n`;
          });
          md += `\n`;
        }
        if (s.calloutFormula) md += `> Formula: ${s.calloutFormula}\n\n`;
        if (s.speakerNotes) md += `**Speaker Notes**: ${s.speakerNotes}\n\n`;
        md += `---\n\n`;
      });
    } else if (resource.resourceType === 'flashcards' && resource.content.flashcards) {
      md += `## Flashcard Deck (${resource.content.flashcards.length} Cards)\n\n`;
      resource.content.flashcards.forEach((fc: any, idx: number) => {
        md += `### Card ${idx + 1}: ${fc.front}\n\n`;
        md += `**Answer**: ${fc.back}\n\n`;
        if (fc.formula) md += `Formula: ${fc.formula}\n\n`;
      });
    } else if (resource.resourceType === 'quiz' && resource.content.quiz) {
      md += `## Diagnostic Quiz\n\n`;
      resource.content.quiz.forEach((q: any, idx: number) => {
        md += `### Question ${idx + 1}: ${q.question}\n\n`;
        q.options.forEach((opt: string, oIdx: number) => {
          md += `* [${oIdx === q.correctIndex ? 'x' : ' '}] ${String.fromCharCode(65 + oIdx)}. ${opt}\n`;
        });
        md += `\n**Explanation**: ${q.explanation}\n\n`;
      });
    } else if (resource.resourceType === 'summary' && resource.content.summary) {
      md += `## Executive Summary\n\n${resource.content.summary.executiveSummary}\n\n`;
    } else {
      md += normalText;
    }

    return md;
  };

  const exportText =
    format === 'normal'
      ? normalText
      : format === 'markdown'
      ? generateMarkdown()
      : JSON.stringify(resource, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownload = () => {
    const ext = format === 'normal' ? 'txt' : format === 'markdown' ? 'md' : 'json';
    const filename = `${resource.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    const mimeType =
      format === 'normal'
        ? 'text/plain;charset=utf-8'
        : format === 'markdown'
        ? 'text/markdown;charset=utf-8'
        : 'application/json';

    const blob = new Blob([exportText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveNormally = () => {
    try {
      const savedKey = `learnco_saved_resource_${resource.id}`;
      localStorage.setItem(
        savedKey,
        JSON.stringify({
          id: resource.id,
          title: resource.title,
          resourceType: resource.resourceType,
          savedAt: new Date().toISOString(),
          textContent: normalText,
        })
      );
      setSavedLocally(true);
      setTimeout(() => setSavedLocally(false), 2500);
    } catch (_) {}
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Save & Copy Artifact
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              {resource.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Pills (Default: Normal Text) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setFormat('normal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                format === 'normal'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Normal Text (Clean)
            </button>
            <button
              onClick={() => setFormat('markdown')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                format === 'markdown'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Markdown (.md)
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                format === 'json'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              JSON Data
            </button>
          </div>

          {/* Quick In-App Save Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveNormally}
            leftIcon={savedLocally ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Bookmark className="w-3.5 h-3.5 text-amber-500" />}
            className="text-xs"
          >
            {savedLocally ? 'Saved to My Notes!' : 'Save Normally to App'}
          </Button>
        </div>

        {/* Text Preview Canvas */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950/60 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
          {exportText}
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Print / PDF
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              {copied ? 'Copied Normally!' : 'Copy Normally'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              {format === 'normal' ? 'Save as Normal Text (.txt)' : `Download .${format === 'markdown' ? 'md' : 'json'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

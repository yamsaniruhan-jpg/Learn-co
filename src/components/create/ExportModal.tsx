import React, { useState } from 'react';
import { CreatorResource } from '../../types/creator';
import {
  X,
  Download,
  Copy,
  CheckCircle2,
  FileCode,
  FileText,
  Printer,
} from 'lucide-react';
import { Button } from '../ui/Button';

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
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const generateMarkdown = (): string => {
    let md = `# ${resource.title}\n\n`;
    md += `**Subject**: ${resource.subjectId.toUpperCase()} | **Difficulty**: ${resource.difficulty} | **Version**: v${resource.version}\n\n---\n\n`;

    if (resource.resourceType === 'flashcards' && resource.content.flashcards) {
      md += `## Flashcard Deck (${resource.content.flashcards.length} Cards)\n\n`;
      resource.content.flashcards.forEach((fc, idx) => {
        md += `### Card ${idx + 1}: ${fc.front}\n\n`;
        md += `**Answer**: ${fc.back}\n\n`;
        if (fc.formula) md += `$$${fc.formula}$$\n\n`;
      });
    } else if (resource.resourceType === 'quiz' && resource.content.quiz) {
      md += `## Diagnostic Quiz\n\n`;
      resource.content.quiz.forEach((q, idx) => {
        md += `### Question ${idx + 1}: ${q.question}\n\n`;
        q.options.forEach((opt, oIdx) => {
          md += `* [${oIdx === q.correctIndex ? 'x' : ' '}] ${String.fromCharCode(65 + oIdx)}. ${opt}\n`;
        });
        md += `\n**Explanation**: ${q.explanation}\n\n`;
      });
    } else if (resource.resourceType === 'summary' && resource.content.summary) {
      md += `## Executive Summary\n\n${resource.content.summary.executiveSummary}\n\n`;
    } else {
      md += `\`\`\`json\n${JSON.stringify(resource.content, null, 2)}\n\`\`\`\n`;
    }

    return md;
  };

  const exportText =
    format === 'markdown' ? generateMarkdown() : JSON.stringify(resource, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'markdown' ? 'md' : 'json';
    const filename = `${resource.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    const blob = new Blob([exportText], {
      type: format === 'markdown' ? 'text/markdown' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Export Artifact
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {resource.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setFormat('markdown')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  format === 'markdown'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Markdown (.md)</span>
              </button>

              <button
                onClick={() => setFormat('json')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  format === 'json'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON Schema (.json)</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Print Sheet
            </Button>
          </div>

          {/* Preview Box */}
          <div className="relative">
            <textarea
              readOnly
              rows={12}
              value={exportText}
              className="w-full p-4 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none select-all"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {copied ? 'Copied to Clipboard' : 'Copy Text'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Download {format === 'markdown' ? '.MD File' : '.JSON File'}
          </Button>
        </div>
      </div>
    </div>
  );
};

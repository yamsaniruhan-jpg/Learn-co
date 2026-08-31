import React, { useState, useRef } from 'react';
import {
  CreatorResourceType,
  SourceType,
  GenerateResourceRequest,
} from '../../types/creator';
import { SubjectId, DifficultyLevel } from '../../types';
import {
  FileText,
  UploadCloud,
  Globe,
  Sparkles,
  Layers,
  HelpCircle,
  BrainCircuit,
  Presentation,
  ClipboardList,
  Key,
  ChevronDown,
  ChevronUp,
  File,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface SourceIntakePanelProps {
  onGenerate: (params: GenerateResourceRequest) => Promise<void>;
  isGenerating: boolean;
  prefillSource?: {
    sourceId?: string;
    title?: string;
    extractedText?: string;
    sourceType?: SourceType;
  };
}

export const SourceIntakePanel: React.FC<SourceIntakePanelProps> = ({
  onGenerate,
  isGenerating,
  prefillSource,
}) => {
  const [sourceType, setSourceType] = useState<SourceType>(
    prefillSource?.sourceType || 'text'
  );
  const [title, setTitle] = useState<string>(prefillSource?.title || '');
  const [textContent, setTextContent] = useState<string>(
    prefillSource?.extractedText || ''
  );
  const [urlInput, setUrlInput] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    base64Data?: string;
  } | null>(null);

  const [subjectId, setSubjectId] = useState<SubjectId>('math');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [selectedResourceType, setSelectedResourceType] =
    useState<CreatorResourceType>('flashcards');

  // Advanced Tuning
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [depthLevel, setDepthLevel] = useState<'standard' | 'rigorous' | 'simplified'>('rigorous');
  const [includeFormulas, setIncludeFormulas] = useState<boolean>(true);
  const [includeBloomTaxonomy, setIncludeBloomTaxonomy] = useState<boolean>(true);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const synthesisTypes: Array<{
    type: CreatorResourceType;
    name: string;
    desc: string;
    icon: React.ReactNode;
    badge: string;
  }> = [
    {
      type: 'flashcards',
      name: 'Spaced Flashcards',
      desc: 'Active recall deck with Q&A and formula anchors',
      icon: <Layers className="w-5 h-5 text-amber-500" />,
      badge: 'High Yield',
    },
    {
      type: 'quiz',
      name: 'Diagnostic Quiz',
      desc: 'Multiple-choice test with first-principles rationales',
      icon: <HelpCircle className="w-5 h-5 text-emerald-500" />,
      badge: 'Bloom Graded',
    },
    {
      type: 'summary',
      name: 'Executive Summary',
      desc: 'High-level synthesis with theorem tables & misconceptions',
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      badge: 'Fast Review',
    },
    {
      type: 'notes',
      name: 'Lecture Compendium',
      desc: 'Structured study guide with step-by-step derivations',
      icon: <FileText className="w-5 h-5 text-indigo-500" />,
      badge: 'Deep Study',
    },
    {
      type: 'slides',
      name: 'Presentation Slides',
      desc: 'Lecture slide deck with speaker scripts & callouts',
      icon: <Presentation className="w-5 h-5 text-purple-500" />,
      badge: 'Presenter Mode',
    },
    {
      type: 'worksheet',
      name: 'Practice Worksheet',
      desc: 'Calibrated problems with toggleable hints & rubrics',
      icon: <ClipboardList className="w-5 h-5 text-rose-500" />,
      badge: 'Hands-on',
    },
    {
      type: 'mindmap',
      name: 'Hierarchical Mind Map',
      desc: 'Structured tree of concepts and invariant relations',
      icon: <BrainCircuit className="w-5 h-5 text-cyan-500" />,
      badge: 'Visual Tree',
    },
    {
      type: 'key_concepts',
      name: 'Invariant Glossary',
      desc: 'First-principles definitions and conservation rules',
      icon: <Key className="w-5 h-5 text-amber-600" />,
      badge: 'Glossary',
    },
  ];

  const handleFileChange = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedFile({
        name: file.name,
        size: file.size,
        base64Data: base64,
      });
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let sourceText = textContent;
    let sourceUrl = urlInput;

    if (sourceType === 'pdf' && uploadedFile) {
      sourceText = `PDF Document: ${uploadedFile.name} (Uploaded content buffer)`;
    }

    const payload: GenerateResourceRequest = {
      sourceId: prefillSource?.sourceId,
      sourceType,
      sourceText,
      sourceUrl,
      resourceType: selectedResourceType,
      title: title.trim() || `Mastery ${selectedResourceType.replace(/_/g, ' ')}`,
      subjectId,
      difficulty,
      options: {
        depthLevel,
        includeFormulas,
        includeBloomTaxonomy,
      },
    };

    await onGenerate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. SOURCE INTAKE SELECTOR */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
                1
              </span>
              <span>Intake Source Material</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload documents, paste lecture notes, or scrape STEM articles to synthesize.
            </p>
          </div>

          {/* Intake Mode Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSourceType('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sourceType === 'text'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw Text / Notes</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('pdf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sourceType === 'pdf'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>PDF / File Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sourceType === 'url'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web Article URL</span>
            </button>
          </div>
        </div>

        {/* Dynamic Input Body Based on Mode */}
        {sourceType === 'text' && (
          <div className="space-y-3">
            <textarea
              rows={6}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste raw lecture text, textbook excerpts, problem sets, or mathematical proofs..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Supports LaTeX mathematical equations ($x^2$, $\nabla f$)</span>
              <span>{textContent.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>
        )}

        {sourceType === 'pdf' && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              className="hidden"
            />

            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Drop your PDF lecture slides or research paper here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  or click to browse from device (PDF, DOCX, TXT up to 10MB)
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-lg">
                    <File className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {uploadedFile.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {(uploadedFile.size / 1024).toFixed(1)} KB • Ready for synthesis
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {sourceType === 'url' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://en.wikipedia.org/wiki/Euler%27s_formula or textbook URL..."
                className="flex-1 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              The AI Engine cleans HTML boilerplate, strips ads, and extracts core principles.
            </p>
          </div>
        )}

        {/* Resource Title & Domain Config */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="sm:col-span-1 space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Artifact Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lagrangian Mechanics Mastery"
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Subject Pillar
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value as SubjectId)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              <option value="math">Mathematics (Pure & Applied)</option>
              <option value="physics">Physics & Mechanics</option>
              <option value="cs">Computer Science & Algorithms</option>
              <option value="chemistry">Chemistry & Thermodynamics</option>
              <option value="biology">Biology & Systems</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Target Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              <option value="easy">Introductory / Foundational</option>
              <option value="medium">Intermediate Undergraduate</option>
              <option value="hard">Advanced / Olympiad Rigorous</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. TARGET SYNTHESIS ARTIFACT PICKER (8 Types) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
              2
            </span>
            <span>Select Output Pedagogical Format</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose how you want this knowledge structured for active retention.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {synthesisTypes.map((item) => {
            const isSelected = selectedResourceType === item.type;
            return (
              <div
                key={item.type}
                onClick={() => setSelectedResourceType(item.type)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-bold ${
                      isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible Advanced Pedagogical Settings */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
          >
            <span>Advanced Pedagogical Parameters</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in duration-150">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Analytical Rigor
                </label>
                <select
                  value={depthLevel}
                  onChange={(e) => setDepthLevel(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="simplified">Simplified / Intuitive</option>
                  <option value="standard">Standard Undergraduate</option>
                  <option value="rigorous">Formal First-Principles (Rigorous)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="includeFormulas"
                  checked={includeFormulas}
                  onChange={(e) => setIncludeFormulas(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="includeFormulas" className="font-semibold text-slate-700 dark:text-slate-300">
                  Force LaTeX Equation Derivations
                </label>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="includeBloomTaxonomy"
                  checked={includeBloomTaxonomy}
                  onChange={(e) => setIncludeBloomTaxonomy(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="includeBloomTaxonomy" className="font-semibold text-slate-700 dark:text-slate-300">
                  Tag Bloom Taxonomy Cognitive Levels
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. GENERATION SUBMIT BUTTON */}
      <div className="flex items-center justify-between p-6 rounded-2xl bg-indigo-900 text-white border border-indigo-700/80 shadow-md">
        <div>
          <h3 className="text-sm font-bold">Ready to Synthesize Artifact</h3>
          <p className="text-xs text-indigo-200 mt-0.5">
            Will generate a verified <strong>{selectedResourceType.replace(/_/g, ' ')}</strong> grounded in first principles.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isGenerating || (sourceType === 'text' && !textContent.trim()) || (sourceType === 'url' && !urlInput.trim())}
          leftIcon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          className="bg-white text-indigo-950 hover:bg-indigo-50 font-bold px-6 shadow-sm"
        >
          {isGenerating ? 'Synthesizing...' : 'Synthesize Resource'}
        </Button>
      </div>
    </form>
  );
};

import React, { useState, useRef, useEffect } from 'react';
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
import { uploadUserFile, auth } from '../../services/firebaseClient';
import { hasMatchingFirebaseIdentity } from '../../services/clientFirestoreSync';
import { useAuth } from '../../context/AuthContext';
import { CreatorClient } from '../../services/creatorClient';
import { extractTextFromFileClient } from '../../utils/guestMode';

interface SourceIntakePanelProps {
  onGenerate: (params: GenerateResourceRequest) => Promise<void>;
  onGuestFallbackGenerate?: (params: GenerateResourceRequest, file?: File | null) => Promise<void>;
  onStorageStatus: (status: string) => void;
  onSourceSaved?: () => void;
  isGenerating: boolean;
  isGenerationLimitReached: boolean;
  prefillSource?: {
    sourceId?: string;
    title?: string;
    extractedText?: string;
    sourceType?: SourceType;
  };
}

export const SourceIntakePanel: React.FC<SourceIntakePanelProps> = ({
  onGenerate,
  onGuestFallbackGenerate,
  onStorageStatus,
  onSourceSaved,
  isGenerating,
  isGenerationLimitReached,
  prefillSource,
}) => {
  const { user } = useAuth();
  const [sourceType, setSourceType] = useState<SourceType>(
    prefillSource?.sourceType || 'text'
  );
  const [title, setTitle] = useState<string>(prefillSource?.title || '');
  const [textContent, setTextContent] = useState<string>(
    prefillSource?.extractedText || ''
  );
  const [urlInput, setUrlInput] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [savedSourceId, setSavedSourceId] = useState<string | null>(null);
  const [intakeError, setIntakeError] = useState('');

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
  const isSubmittingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const [isUploading, setIsUploading] = useState<boolean>(false);

  const isSupportedFile = (file: File) => {
    const lower = file.name.toLowerCase();
    return (
      lower.endsWith('.pdf') ||
      lower.endsWith('.txt') ||
      lower.endsWith('.md') ||
      lower.endsWith('.markdown') ||
      lower.endsWith('.csv')
    );
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    setIntakeError('');
    onStorageStatus('');
    setSavedSourceId(null);
    if (!isSupportedFile(file) || file.size === 0 || file.size > 7 * 1024 * 1024) {
      setUploadedFile(null);
      setIntakeError('Choose a non-empty PDF, TXT, MD, or CSV file up to 7 MB.');
      return;
    }
    setUploadedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const readFile = async (file: File): Promise<string> => {
    if (typeof file.arrayBuffer === 'function') {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      const mime = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
      return `data:${mime};base64,${btoa(binary)}`;
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read file.'));
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsDataURL(file);
    });
  };

  const readTextFile = async (file: File): Promise<string> => {
    if (typeof file.text === 'function') {
      return file.text();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read text file.'));
      reader.onerror = () => reject(new Error('Could not read text file.'));
      reader.readAsText(file);
    });
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

  const uploadSelectedFile = async (): Promise<string | undefined> => {
    if (!uploadedFile) return undefined;
    if (savedSourceId) return savedSourceId;

    setIsUploading(true);
    setIntakeError('');
    try {
      const isPdf = uploadedFile.name.toLowerCase().endsWith('.pdf');
      const source = isPdf
        ? await CreatorClient.createSource({
            title: title.trim() || uploadedFile.name,
            sourceType: 'pdf',
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            fileBase64: await readFile(uploadedFile),
          })
        : await CreatorClient.createSource({
            title: title.trim() || uploadedFile.name,
            sourceType: 'text',
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            content: await readTextFile(uploadedFile),
          });

      setSavedSourceId(source.id);
      if (onSourceSaved) {
        onSourceSaved();
      }
      onStorageStatus(`${isPdf ? 'PDF' : 'Document'} saved to server storage.`);
      const firebaseUser = auth.currentUser;
      if (firebaseUser?.emailVerified && hasMatchingFirebaseIdentity(firebaseUser.email, user?.email)) {
        try {
          await uploadUserFile(firebaseUser.uid, source.id, uploadedFile);
          onStorageStatus(`${isPdf ? 'PDF' : 'Document'} saved to server storage and Firebase Storage.`);
        } catch {
          onStorageStatus(`${isPdf ? 'PDF' : 'Document'} saved to server storage; Firebase Storage upload failed. Your Firebase copy was not saved.`);
        }
      } else {
        onStorageStatus(`${isPdf ? 'PDF' : 'Document'} saved to server storage; Firebase copy not saved. Sign in with a matching, verified Firebase account to enable upload.`);
      }
      return source.id;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isUploading || isGenerating) return;
    isSubmittingRef.current = true;

    try {
      setIntakeError('');
      let sourceId = prefillSource?.sourceType === sourceType ? prefillSource?.sourceId : undefined;
      let effectiveSourceType: SourceType = sourceType;
      if (sourceType === 'pdf' && uploadedFile) {
        effectiveSourceType = uploadedFile.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'text';
        try {
          sourceId = await uploadSelectedFile();
        } catch (err: any) {
          if (isMountedRef.current) {
            setIntakeError(err?.message || 'Could not save uploaded file.');
          }
          return;
        }
      }

      if (!isMountedRef.current) return;

      const payload: GenerateResourceRequest = {
        sourceId,
        sourceType: effectiveSourceType,
        sourceText: sourceType === 'text' ? textContent : undefined,
        sourceUrl: sourceType === 'url' ? urlInput : undefined,
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
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleGuestFallbackClick = async () => {
    if (!onGuestFallbackGenerate || isGenerating || isUploading) return;
    setIntakeError('');
    let guestSourceText = sourceType === 'text' ? textContent : undefined;
    if (sourceType === 'pdf' && uploadedFile) {
      guestSourceText = await extractTextFromFileClient(uploadedFile);
    }
    const payload: GenerateResourceRequest = {
      sourceType: sourceType === 'pdf' && uploadedFile ? 'text' : sourceType,
      sourceText: guestSourceText,
      sourceUrl: sourceType === 'url' ? urlInput : undefined,
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
    await onGuestFallbackGenerate(payload, uploadedFile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. SOURCE INTAKE SELECTOR */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#2D2A4A] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#6C5CE7] text-white flex items-center justify-center text-xs">
                1
              </span>
              <span>Intake Source Material</span>
            </h2>
            <p className="text-xs text-[#6B6890] dark:text-[#9D9BB8] mt-0.5">
              Upload documents, paste lecture notes, or scrape STEM articles to synthesize.
            </p>
          </div>

          {/* Intake Mode Switcher */}
          <div className="flex bg-[#F7F5FF] dark:bg-[#16161C] p-1 rounded-xl border border-[#E3DFF5] dark:border-[#232329] overflow-x-auto max-w-full scrollbar-none w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSourceType('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                sourceType === 'text'
                  ? 'bg-white dark:bg-[#232329] text-[#6C5CE7] dark:text-[#CCFF00] shadow-xs'
                  : 'text-[#6B6890] dark:text-[#9D9BB8] hover:text-[#2D2A4A] dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw Text / Notes</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('pdf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                sourceType === 'pdf'
                  ? 'bg-white dark:bg-[#232329] text-[#6C5CE7] dark:text-[#CCFF00] shadow-xs'
                  : 'text-[#6B6890] dark:text-[#9D9BB8] hover:text-[#2D2A4A] dark:hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>PDF / File Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                sourceType === 'url'
                  ? 'bg-white dark:bg-[#232329] text-[#6C5CE7] dark:text-[#CCFF00] shadow-xs'
                  : 'text-[#6B6890] dark:text-[#9D9BB8] hover:text-[#2D2A4A] dark:hover:text-white'
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
              className="w-full p-4 rounded-xl border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF]/60 dark:bg-[#16161C] text-xs sm:text-sm text-[#2D2A4A] dark:text-white placeholder:text-[#6B6890] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
            />
            <div className="flex items-center justify-between text-[11px] text-[#6B6890] dark:text-[#9D9BB8]">
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
              accept=".pdf,.txt,.md,.markdown,.csv,application/pdf,text/plain,text/markdown,text/csv"
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
                    ? 'border-[#6C5CE7] bg-[#F3F0FF] dark:bg-[#1C1A2E]'
                    : 'border-[#E3DFF5] dark:border-[#2E2D3D] hover:border-[#6C5CE7] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C]'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-[#6C5CE7] dark:text-[#A594FF] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#2D2A4A] dark:text-white">
                  Drop your PDF, TXT, Markdown, or CSV lecture notes here
                </p>
                <p className="text-xs text-[#6B6890] dark:text-[#9D9BB8] mt-1">
                  or click to browse from device (up to 7 MB)
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#6C5CE7]/30 bg-[#F3F0FF]/60 dark:bg-[#16161C] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-[#6C5CE7] text-white rounded-lg shrink-0">
                    <File className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#2D2A4A] dark:text-white truncate">
                        {uploadedFile.name}
                      </h4>
                      {savedSourceId && (
                        <Badge variant="success" size="sm">
                          Saved to Sources
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B6890] dark:text-[#9D9BB8]">
                      {(uploadedFile.size / 1024).toFixed(1)} KB • {savedSourceId ? 'Uploaded & ready for synthesis' : 'Ready to upload & synthesize'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!savedSourceId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading || isGenerating}
                      onClick={async () => {
                        try {
                          await uploadSelectedFile();
                        } catch (err: any) {
                          setIntakeError(err?.message || 'Could not upload file.');
                        }
                      }}
                      className="text-xs font-bold"
                    >
                      {isUploading ? 'Uploading...' : 'Upload to Sources'}
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setUploadedFile(null); setSavedSourceId(null); onStorageStatus(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="p-1.5 rounded-lg hover:bg-[#EDE9FE] dark:hover:bg-[#232329] text-[#6B6890]"
                    aria-label="Remove selected file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
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
                className="flex-1 p-3.5 rounded-xl border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF]/60 dark:bg-[#16161C] text-xs sm:text-sm text-[#2D2A4A] dark:text-white placeholder:text-[#6B6890] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
              />
            </div>
            <p className="text-[11px] text-[#6B6890] dark:text-[#9D9BB8]">
              The AI Engine cleans HTML boilerplate, strips ads, and extracts core principles.
            </p>
          </div>
        )}

        {intakeError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex flex-wrap items-center justify-between gap-2">
            <p role="alert" className="text-xs text-rose-700 dark:text-rose-200 font-semibold">
              {intakeError}
            </p>
            {onGuestFallbackGenerate && !isGenerationLimitReached && (
              <button
                type="button"
                onClick={handleGuestFallbackClick}
                disabled={isGenerating || isUploading}
                className="px-3.5 py-1.5 rounded-xl bg-[#CCFF00] hover:bg-[#B8E600] text-[#09090B] text-xs font-extrabold shadow-sm cursor-pointer shrink-0"
              >
                Retry &amp; Create in Guest Mode (Not Saved)
              </button>
            )}
          </div>
        )}

        {/* Resource Title & Domain Config */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E3DFF5] dark:border-[#232329]">
          <div className="sm:col-span-1 space-y-1">
            <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#D4D2E8]">
              Artifact Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lagrangian Mechanics Mastery"
              className="w-full p-2.5 rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF]/60 dark:bg-[#16161C] text-xs text-[#2D2A4A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#D4D2E8]">
              Subject Pillar
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value as SubjectId)}
              className="w-full p-2.5 rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF]/60 dark:bg-[#16161C] text-xs text-[#2D2A4A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] font-semibold"
            >
              <option value="math">Mathematics (Pure & Applied)</option>
              <option value="physics">Physics & Mechanics</option>
              <option value="cs">Computer Science & Algorithms</option>
              <option value="chemistry">Chemistry & Thermodynamics</option>
              <option value="biology">Biology & Systems</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#2D2A4A] dark:text-[#D4D2E8]">
              Target Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full p-2.5 rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF]/60 dark:bg-[#16161C] text-xs text-[#2D2A4A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] font-semibold"
            >
              <option value="easy">Introductory / Foundational</option>
              <option value="medium">Intermediate Undergraduate</option>
              <option value="hard">Advanced / Olympiad Rigorous</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. TARGET SYNTHESIS ARTIFACT PICKER (8 Types) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] space-y-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#2D2A4A] dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#6C5CE7] text-white flex items-center justify-center text-xs">
              2
            </span>
            <span>Select Output Pedagogical Format</span>
          </h2>
          <p className="text-xs text-[#6B6890] dark:text-[#9D9BB8] mt-0.5">
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
                    ? 'border-[#6C5CE7] bg-[#F3F0FF] dark:bg-[#1C1A2E] ring-2 ring-[#6C5CE7]/20 shadow-xs'
                    : 'border-[#E3DFF5] dark:border-[#232329] bg-white dark:bg-[#16161C] hover:border-[#6C5CE7]/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#F7F5FF] dark:bg-[#111114]">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6890] dark:text-[#9D9BB8]">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#2D2A4A] dark:text-white">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-[#6B6890] dark:text-[#9D9BB8] mt-1 line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E3DFF5] dark:border-[#232329] flex items-center justify-between text-[11px]">
                  <span
                    className={`font-bold ${
                      isSelected ? 'text-[#6C5CE7] dark:text-[#CCFF00]' : 'text-[#6B6890] dark:text-[#9D9BB8]'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#6C5CE7] dark:text-[#CCFF00]" />}
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
            className="flex items-center gap-1.5 text-xs font-bold text-[#6B6890] dark:text-[#9D9BB8] hover:text-[#6C5CE7] cursor-pointer"
          >
            <span>Advanced Pedagogical Parameters</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 rounded-xl bg-[#F7F5FF] dark:bg-[#16161C] border border-[#E3DFF5] dark:border-[#232329] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in duration-150">
              <div>
                <label className="font-bold text-[#2D2A4A] dark:text-[#D4D2E8] block mb-1">
                  Analytical Rigor
                </label>
                <select
                  value={depthLevel}
                  onChange={(e) => setDepthLevel(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-white dark:bg-[#111114] text-xs font-semibold text-[#2D2A4A] dark:text-white"
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
                  className="rounded border-[#E3DFF5] text-[#6C5CE7] focus:ring-[#6C5CE7]"
                />
                <label htmlFor="includeFormulas" className="font-semibold text-[#2D2A4A] dark:text-[#D4D2E8]">
                  Force LaTeX Equation Derivations
                </label>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="includeBloomTaxonomy"
                  checked={includeBloomTaxonomy}
                  onChange={(e) => setIncludeBloomTaxonomy(e.target.checked)}
                  className="rounded border-[#E3DFF5] text-[#6C5CE7] focus:ring-[#6C5CE7]"
                />
                <label htmlFor="includeBloomTaxonomy" className="font-semibold text-[#2D2A4A] dark:text-[#D4D2E8]">
                  Tag Bloom Taxonomy Cognitive Levels
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. GENERATION SUBMIT BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#16161C] text-white border border-[#232329] shadow-md">
        <div>
          <h3 className="text-sm font-bold text-white">Ready to Synthesize Artifact</h3>
          <p className="text-xs text-[#B4B0D5] mt-0.5">
            Will generate a verified <strong>{selectedResourceType.replace(/_/g, ' ')}</strong> grounded in first principles.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isGenerating || isUploading || isGenerationLimitReached || (sourceType === 'pdf' && !uploadedFile && !(prefillSource?.sourceType === 'pdf' && prefillSource?.sourceId)) || (sourceType === 'text' && !textContent.trim()) || (sourceType === 'url' && !urlInput.trim())}
          leftIcon={(isGenerating || isUploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : isGenerationLimitReached ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          className={isGenerationLimitReached ? "bg-red-500 text-white cursor-not-allowed" : "bg-[#CCFF00] text-[#09090B] hover:bg-[#B8E600] font-extrabold px-6 shadow-sm"}
        >
          {isGenerating ? 'Synthesizing...' : isGenerationLimitReached ? 'Limit Reached' : 'Synthesize Resource'}
        </Button>
      </div>
    </form>
  );
};

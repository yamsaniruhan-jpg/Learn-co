import React, { useState } from 'react';
import { CreatorResource } from '../../types/creator';
import { SubjectId, DifficultyLevel } from '../../types';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ResourceEditorModalProps {
  resource: CreatorResource;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: {
    title: string;
    tags: string[];
    subjectId: SubjectId;
    difficulty: DifficultyLevel;
    content: any;
    changelog: string;
  }) => Promise<void>;
}

export const ResourceEditorModal: React.FC<ResourceEditorModalProps> = ({
  resource,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState<string>(resource.title);
  const [tagsString, setTagsString] = useState<string>(
    resource.tags ? resource.tags.join(', ') : ''
  );
  const [subjectId, setSubjectId] = useState<SubjectId>(resource.subjectId);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(resource.difficulty);
  const [rawJson, setRawJson] = useState<string>(
    JSON.stringify(resource.content, null, 2)
  );
  const [changelog, setChangelog] = useState<string>('Refined theorem explanations');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      const parsedContent = JSON.parse(rawJson);
      setJsonError(null);
      setIsSaving(true);

      const parsedTags = tagsString
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await onSave({
        title: title.trim() || resource.title,
        tags: parsedTags,
        subjectId,
        difficulty,
        content: parsedContent,
        changelog: changelog.trim() || `Updated to version ${resource.version + 1}`,
      });

      onClose();
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax in resource content editor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Version {resource.version} Editor
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Edit Artifact Content & Metadata
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Artifact Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Comma-separated Tags
              </label>
              <input
                type="text"
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                placeholder="calculus, derivatives, optimization"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value as SubjectId)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="math">Mathematics</option>
                <option value="physics">Physics</option>
                <option value="cs">Computer Science</option>
                <option value="chemistry">Chemistry</option>
                <option value="biology">Biology</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* JSON Content Editor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Raw Structured Content (JSON Schema)
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                type: {resource.resourceType}
              </span>
            </div>
            <textarea
              rows={12}
              value={rawJson}
              onChange={(e) => {
                setRawJson(e.target.value);
                setJsonError(null);
              }}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {jsonError && (
              <div className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{jsonError}</span>
              </div>
            )}
          </div>

          {/* Version Changelog note */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Version Changelog Summary
            </label>
            <input
              type="text"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="e.g. Corrected sign error in Theorem 2 derivation"
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {isSaving ? 'Saving Version...' : 'Save New Version'}
          </Button>
        </div>
      </div>
    </div>
  );
};

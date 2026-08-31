import React, { useState } from 'react';
import {
  CreatorResource,
  CreatorResourceVersion,
  CreatorResourceType,
} from '../../types/creator';
import {
  Sparkles,
  Layers,
  FileText,
  Sliders,
  HelpCircle,
  BrainCircuit,
  Presentation,
  Key,
  ClipboardList,
  Download,
  Send,
  Edit3,
  Trash2,
  Share2,
  Clock,
  Code2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FlashcardDeckViewer } from './FlashcardDeckViewer';
import { QuizViewer } from './QuizViewer';
import { MindMapViewer } from './MindMapViewer';
import { SlideDeckViewer } from './SlideDeckViewer';
import { SummaryViewer } from './SummaryViewer';
import { NotesViewer } from './NotesViewer';
import { WorksheetViewer } from './WorksheetViewer';
import { KeyConceptsViewer } from './KeyConceptsViewer';

interface ResourceViewerProps {
  resource: CreatorResource;
  versions?: CreatorResourceVersion[];
  onEdit?: (resource: CreatorResource) => void;
  onDelete?: (resourceId: string) => void;
  onExport?: (resource: CreatorResource) => void;
  onAddToPractice?: (resource: CreatorResource) => void;
  onSelectVersion?: (version: CreatorResourceVersion) => void;
}

export const ResourceViewer: React.FC<ResourceViewerProps> = ({
  resource,
  versions = [],
  onEdit,
  onDelete,
  onExport,
  onAddToPractice,
  onSelectVersion,
}) => {
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const getResourceTypeIcon = (type: CreatorResourceType) => {
    switch (type) {
      case 'flashcards':
        return <Layers className="w-4 h-4 text-amber-500" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-emerald-500" />;
      case 'summary':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'notes':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'slides':
        return <Presentation className="w-4 h-4 text-purple-500" />;
      case 'worksheet':
        return <ClipboardList className="w-4 h-4 text-rose-500" />;
      case 'mindmap':
        return <BrainCircuit className="w-4 h-4 text-cyan-500" />;
      case 'key_concepts':
      default:
        return <Key className="w-4 h-4 text-amber-600" />;
    }
  };

  const renderActiveViewer = () => {
    if (showRawJson) {
      return (
        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-[600px]">
          <pre>{JSON.stringify(resource.content, null, 2)}</pre>
        </div>
      );
    }

    switch (resource.resourceType) {
      case 'flashcards':
        return <FlashcardDeckViewer flashcards={resource.content.flashcards || []} title={resource.title} />;
      case 'quiz':
        return <QuizViewer quiz={resource.content.quiz || []} title={resource.title} />;
      case 'mindmap':
        return (
          <MindMapViewer
            mindmap={resource.content.mindmap || { rootTopic: resource.title, nodes: [] }}
            title={resource.title}
          />
        );
      case 'slides':
        return <SlideDeckViewer slides={resource.content.slides || []} title={resource.title} />;
      case 'summary':
        return (
          <SummaryViewer
            summary={
              resource.content.summary || {
                executiveSummary: 'No summary content',
                theoremsAndPrinciples: [],
                misconceptions: [],
                actionableTakeaways: [],
              }
            }
            title={resource.title}
          />
        );
      case 'notes':
        return (
          <NotesViewer
            notes={resource.content.notes || { title: resource.title, overview: '', sections: [] }}
            title={resource.title}
          />
        );
      case 'worksheet':
        return (
          <WorksheetViewer
            worksheet={
              resource.content.worksheet || {
                title: resource.title,
                instructions: '',
                difficulty: 'medium',
                problems: [],
              }
            }
            title={resource.title}
          />
        );
      case 'key_concepts':
      default:
        return <KeyConceptsViewer keyConcepts={resource.content.keyConcepts || []} title={resource.title} />;
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Meta Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              {getResourceTypeIcon(resource.resourceType)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {resource.resourceType.replace(/_/g, ' ')}
                </span>
                <Badge variant="default" size="sm">
                  {resource.subjectId.toUpperCase()}
                </Badge>
                <Badge
                  variant={resource.difficulty === 'hard' ? 'error' : 'default'}
                  size="sm"
                >
                  {resource.difficulty}
                </Badge>
                <span className="text-xs text-slate-400">v{resource.version}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {resource.title}
              </h1>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {onAddToPractice && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAddToPractice(resource)}
                leftIcon={<Send className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Send to Practice Arena
              </Button>
            )}

            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport(resource)}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Export
              </Button>
            )}

            {onEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(resource)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Edit Content
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawJson(!showRawJson)}
              leftIcon={<Code2 className="w-3.5 h-3.5" />}
              className="text-xs"
              title="Toggle Raw JSON Schema"
            >
              {showRawJson ? 'Render View' : 'Schema JSON'}
            </Button>

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(resource.id)}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Version dropdown and Tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-400">Tags:</span>
            {resource.tags && resource.tags.length > 0 ? (
              resource.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]"
                >
                  #{tag}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic">No tags</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {versions && versions.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={resource.version}
                  onChange={(e) => {
                    const verNum = Number(e.target.value);
                    const match = versions.find((v) => v.versionNumber === verNum);
                    if (match && onSelectVersion) onSelectVersion(match);
                  }}
                  className="bg-slate-100 dark:bg-slate-800 border-none text-xs rounded-md px-2 py-1 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.versionNumber}>
                      Version {v.versionNumber} ({new Date(v.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleCopyShare}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Content Canvas */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {renderActiveViewer()}
      </div>
    </div>
  );
};

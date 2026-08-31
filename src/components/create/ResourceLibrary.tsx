import React, { useState } from 'react';
import { CreatorResource, CreatorResourceType } from '../../types/creator';
import { SubjectId } from '../../types';
import {
  Search,
  Filter,
  Layers,
  HelpCircle,
  FileText,
  Presentation,
  ClipboardList,
  BrainCircuit,
  Key,
  Trash2,
  Edit3,
  Download,
  Send,
  Eye,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ResourceLibraryProps {
  resources: CreatorResource[];
  onSelectResource: (resource: CreatorResource) => void;
  onEditResource: (resource: CreatorResource) => void;
  onDeleteResource: (resourceId: string) => void;
  onExportResource: (resource: CreatorResource) => void;
  onAddToPractice: (resource: CreatorResource) => void;
  onCreateNew: () => void;
}

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({
  resources,
  onSelectResource,
  onEditResource,
  onDeleteResource,
  onExportResource,
  onAddToPractice,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const filteredResources = resources.filter((r) => {
    if (selectedType !== 'all' && r.resourceType !== selectedType) return false;
    if (selectedSubject !== 'all' && r.subjectId !== selectedSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchTags = r.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchTags) return false;
    }
    return true;
  });

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

  const getResourceSummaryCount = (r: CreatorResource) => {
    if (r.resourceType === 'flashcards' && r.content.flashcards) {
      return `${r.content.flashcards.length} Cards`;
    }
    if (r.resourceType === 'quiz' && r.content.quiz) {
      return `${r.content.quiz.length} Questions`;
    }
    if (r.resourceType === 'slides' && r.content.slides) {
      return `${r.content.slides.length} Slides`;
    }
    if (r.resourceType === 'worksheet' && r.content.worksheet) {
      return `${r.content.worksheet.problems?.length || 0} Problems`;
    }
    if (r.resourceType === 'mindmap' && r.content.mindmap) {
      return `${r.content.mindmap.nodes?.length || 0} Nodes`;
    }
    if (r.resourceType === 'key_concepts' && r.content.keyConcepts) {
      return `${r.content.keyConcepts.length} Concepts`;
    }
    return '1 Document';
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artifact title, concept, or tags..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Subjects</option>
              <option value="math">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="cs">Computer Science</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              onClick={onCreateNew}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Synthesize New
            </Button>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Artifacts' },
            { id: 'flashcards', label: 'Flashcards' },
            { id: 'quiz', label: 'Quizzes' },
            { id: 'summary', label: 'Summaries' },
            { id: 'notes', label: 'Lecture Notes' },
            { id: 'slides', label: 'Slides' },
            { id: 'worksheet', label: 'Worksheets' },
            { id: 'mindmap', label: 'Mind Maps' },
            { id: 'key_concepts', label: 'Key Concepts' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                selectedType === type.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Artifacts Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No synthesized resources match your search criteria. Ingest a document or lecture notes to create your first interactive artifact.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateNew}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Create First Artifact
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              onClick={() => onSelectResource(res)}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between space-y-4 group shadow-xs hover:shadow-md"
            >
              {/* Header inside Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {getResourceTypeIcon(res.resourceType)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {res.resourceType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="default" size="sm">
                      {res.subjectId.toUpperCase()}
                    </Badge>
                    <Badge
                      variant={res.difficulty === 'hard' ? 'error' : 'default'}
                      size="sm"
                    >
                      {res.difficulty}
                    </Badge>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {res.title}
                </h3>
              </div>

              {/* Tags & Count */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">{getResourceSummaryCount(res)}</span>
                  <span className="text-[11px] text-slate-400">v{res.version}</span>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  {res.tags?.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Toolbar on Card */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                <button
                  onClick={() => onSelectResource(res)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onAddToPractice(res)}
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600"
                    title="Send to Practice Arena"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onExportResource(res)}
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600"
                    title="Export Markdown/JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onEditResource(res)}
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600"
                    title="Edit content"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteResource(res.id)}
                    className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-500"
                    title="Delete"
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

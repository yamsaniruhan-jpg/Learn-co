import React, { useState } from 'react';
import { MindMapContent, MindMapNode } from '../../types/creator';
import {
  Network,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Info,
  Maximize2,
  FolderTree,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface MindMapViewerProps {
  mindmap: MindMapContent;
  title?: string;
}

export const MindMapViewer: React.FC<MindMapViewerProps> = ({ mindmap, title }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  if (!mindmap || !mindmap.nodes || mindmap.nodes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No mind map nodes found.
      </div>
    );
  }

  // Find root node (parentId is null/undefined or 'root')
  const rootNode =
    mindmap.nodes.find((n) => !n.parentId || n.parentId === 'root') || mindmap.nodes[0];

  const selectedNode = mindmap.nodes.find((n) => n.id === selectedNodeId) || rootNode;

  // Build children map
  const childrenMap: Record<string, MindMapNode[]> = {};
  mindmap.nodes.forEach((node) => {
    if (node.parentId) {
      if (!childrenMap[node.parentId]) childrenMap[node.parentId] = [];
      childrenMap[node.parentId].push(node);
    }
  });

  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const renderTreeBranch = (node: MindMapNode, depth = 0) => {
    const children = childrenMap[node.id] || [];
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedNodes[node.id];
    const isSelected = (selectedNodeId || rootNode.id) === node.id;

    return (
      <div key={node.id} className="relative space-y-2">
        <div
          onClick={() => setSelectedNodeId(node.id)}
          className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
            isSelected
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {hasChildren ? (
              <button
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              </span>
            )}

            <div className="truncate">
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {node.label}
              </span>
              {node.formula && (
                <span className="ml-2 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                  {node.formula}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {node.category && (
              <Badge variant="default" size="sm">
                {node.category}
              </Badge>
            )}
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-4 pl-1">
            {children.map((child) => renderTreeBranch(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Knowledge Tree Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Hierarchical Invariant Map ({mindmap.nodes.length} Nodes)
            </h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsedNodes({})}
            className="text-xs"
          >
            Expand All
          </Button>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {renderTreeBranch(rootNode)}
        </div>
      </div>

      {/* Selected Node Detail Inspector */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Node Diagnostic Inspector
          </h4>
        </div>

        {selectedNode ? (
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {selectedNode.category || 'Core Pillar'}
                </span>
                <Badge variant="primary" size="sm">
                  Active Focus
                </Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {selectedNode.label}
              </h3>
            </div>

            {selectedNode.description && (
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedNode.description}
              </div>
            )}

            {selectedNode.formula && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Mathematical Invariant
                </span>
                <p className="text-xs font-mono font-bold text-indigo-950 dark:text-indigo-200">
                  $${selectedNode.formula}$$
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                {childrenMap[selectedNode.id]?.length || 0} direct dependent concepts
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
            Select any node on the left to inspect its invariants and derivations.
          </div>
        )}
      </div>
    </div>
  );
};

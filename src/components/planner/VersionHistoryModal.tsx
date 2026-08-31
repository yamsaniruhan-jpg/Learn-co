import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  History,
  RotateCcw,
  X,
  Clock,
  Sparkles,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { StudyPlanVersion } from '../../types/planner';

interface VersionHistoryModalProps {
  planId: string;
  isOpen: boolean;
  onClose: () => void;
  onRollback: (versionId: string) => Promise<void>;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  planId,
  isOpen,
  onClose,
  onRollback,
}) => {
  const [versions, setVersions] = useState<StudyPlanVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && planId) {
      loadVersions();
    }
  }, [isOpen, planId]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/planner/versions/${planId}`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    setRollingBackId(versionId);
    try {
      await onRollback(versionId);
      onClose();
    } finally {
      setRollingBackId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-semibold text-slate-100 text-base">Plan Version History</h3>
                <p className="text-xs text-slate-400">View timeline & restore previous schedule snapshots</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Versions List */}
          <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading version snapshots...</div>
            ) : versions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No previous versions found for this plan.</div>
            ) : (
              versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    idx === 0
                      ? 'bg-indigo-950/30 border-indigo-500/40'
                      : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 border border-slate-700 text-slate-300">
                          v{ver.version}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-100">{ver.title}</h4>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-emerald-500/20 text-emerald-300">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">{ver.changeSummary}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          {ver.createdBy === 'AI' ? (
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                          ) : (
                            <User className="w-3 h-3 text-slate-400" />
                          )}
                          {ver.createdBy === 'AI' ? 'AI Optimized' : 'Manual'}
                        </span>
                        <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                        <span>{ver.snapshot?.tasks?.length || 0} tasks</span>
                      </div>
                    </div>

                    {idx > 0 && (
                      <button
                        onClick={() => handleRollback(ver.id)}
                        disabled={rollingBackId === ver.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-indigo-600 text-white transition-colors shrink-0 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restore
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

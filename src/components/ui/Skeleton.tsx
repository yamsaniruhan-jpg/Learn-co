import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-xl bg-[#E3DFF5]/70 dark:bg-[#3D3861]/70 ${className}`}
  />
);

export const CardSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div
    role="status"
    aria-label="Loading content"
    className={`rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] p-5 space-y-3 ${className}`}
  >
    <div className="flex items-center justify-between gap-3">
      <Skeleton className="h-4 w-1/3 rounded-lg" />
      <Skeleton className="h-4 w-16 rounded-lg" />
    </div>
    {Array.from({ length: lines }).map((_, idx) => (
      <Skeleton
        key={idx}
        className={`h-3.5 rounded-lg ${idx === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
    <span className="sr-only">Loading...</span>
  </div>
);

export const ChartSkeleton: React.FC<{ label?: string }> = ({
  label = 'Loading analytics charts...',
}) => (
  <div
    role="status"
    aria-label={label}
    className="space-y-6"
  >
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((idx) => (
        <CardSkeleton key={idx} lines={2} />
      ))}
    </div>
    <div className="rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="h-56 flex items-end gap-3 pt-4">
        {[45, 72, 58, 88, 64, 92, 52].map((pct, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end h-full">
            <div
              className="animate-pulse w-full rounded-t-lg bg-[#E3DFF5]/70 dark:bg-[#3D3861]/70"
              style={{ height: `${pct}%` }}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] text-center">{label}</p>
    </div>
  </div>
);

export const CanvasSkeleton: React.FC<{ label?: string }> = ({
  label = 'Loading interactive 3D simulation...',
}) => (
  <div
    role="status"
    aria-label={label}
    className="relative aspect-[16/9] w-full rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#F7F5FF] dark:bg-[#1E1B33] overflow-hidden flex flex-col items-center justify-center p-6 gap-4"
  >
    <Skeleton className="w-16 h-16 rounded-2xl" />
    <Skeleton className="h-4 w-56 rounded-lg" />
    <Skeleton className="h-3 w-40 rounded-lg" />
    <p className="text-xs font-medium text-[#6B6890] dark:text-[#B4B0D5]">{label}</p>
  </div>
);

export const SubjectCurriculumSkeleton: React.FC<{ label?: string }> = ({
  label = 'Loading subject chapters & concepts...',
}) => (
  <div role="status" aria-label={label} className="space-y-4">
    <div className="flex items-center justify-between px-1">
      <Skeleton className="h-4 w-52 rounded-lg" />
      <Skeleton className="h-4 w-24 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((idx) => (
        <CardSkeleton key={idx} lines={3} />
      ))}
    </div>
    <span className="sr-only">{label}</span>
  </div>
);

export const ScreenSkeleton: React.FC<{ label?: string; rows?: number }> = ({
  label = 'Loading view...',
  rows = 2,
}) => (
  <div role="status" aria-label={label} className="max-w-5xl mx-auto space-y-5 py-4">
    <CardSkeleton lines={2} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: Math.max(2, rows) }).map((_, idx) => (
        <CardSkeleton key={idx} lines={3} />
      ))}
    </div>
    <span className="sr-only">{label}</span>
  </div>
);

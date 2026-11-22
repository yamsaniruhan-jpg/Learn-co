import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';

interface GraphStep {
  visited: number[];
  frontier: number[];
  path: number[];
  totalCost: number;
  expandedCount: number;
}

const ROWS = 6;
const COLS = 8;
const START = 0; // (0,0)
const GOAL = ROWS * COLS - 1; // (5,7)

const DEFAULT_WALLS = new Set([9, 10, 17, 25, 28, 36, 37, 22]);
const DEFAULT_WEIGHTS = new Set([12, 13, 20, 29, 30]); // Weighted cost 5 cells

function buildSteps(walls: Set<number>, weighted: Set<number>, algo: 'dijkstra' | 'bfs'): GraphStep {
  const n = ROWS * COLS;
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  const visitedOrder: number[] = [];
  const visitedSet = new Set<number>();

  dist[START] = 0;

  if (algo === 'bfs') {
    const queue = [START];
    visitedSet.add(START);
    while (queue.length > 0) {
      const u = queue.shift()!;
      visitedOrder.push(u);
      if (u === GOAL) break;
      const r = Math.floor(u / COLS);
      const c = u % COLS;
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const v = nr * COLS + nc;
        if (walls.has(v) || visitedSet.has(v)) continue;
        visitedSet.add(v);
        parent[v] = u;
        dist[v] = dist[u] + (weighted.has(v) ? 5 : 1);
        queue.push(v);
      }
    }
  } else {
    // Dijkstra
    const pq: Array<{ node: number; d: number }> = [{ node: START, d: 0 }];
    while (pq.length > 0) {
      pq.sort((a, b) => a.d - b.d);
      const cur = pq.shift()!;
      const u = cur.node;
      if (visitedSet.has(u)) continue;
      visitedSet.add(u);
      visitedOrder.push(u);
      if (u === GOAL) break;
      const r = Math.floor(u / COLS);
      const c = u % COLS;
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const v = nr * COLS + nc;
        if (walls.has(v)) continue;
        const w = weighted.has(v) ? 5 : 1;
        if (dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          parent[v] = u;
          pq.push({ node: v, d: dist[v] });
        }
      }
    }
  }

  const path: number[] = [];
  if (dist[GOAL] < Infinity) {
    let curr = GOAL;
    while (curr !== -1) {
      path.unshift(curr);
      curr = parent[curr];
    }
  }

  return {
    visited: visitedOrder,
    frontier: [],
    path,
    totalCost: dist[GOAL] < Infinity ? dist[GOAL] : -1,
    expandedCount: visitedOrder.length,
  };
}

export const CSAlgorithmVisualizerLab: React.FC = () => {
  const [tab, setTab] = useState<'graph' | 'segtree'>('graph');
  const [algo, setAlgo] = useState<'dijkstra' | 'bfs'>('dijkstra');
  const [brushMode, setBrushMode] = useState<'wall' | 'mud'>('wall');
  const [walls, setWalls] = useState<Set<number>>(() => new Set(DEFAULT_WALLS));
  const [weighted, setWeighted] = useState<Set<number>>(() => new Set(DEFAULT_WEIGHTS));
  const [stepLimit, setStepLimit] = useState<number>(999);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Segment tree state (8 leaves)
  const [arr, setArr] = useState<number[]>([3, 7, 2, 9, 4, 6, 1, 8]);
  const [queryL, setQueryL] = useState<number>(1);
  const [queryR, setQueryR] = useState<number>(5);

  const solved = useMemo(() => buildSteps(walls, weighted, algo), [walls, weighted, algo]);
  const maxSteps = solved.visited.length;
  const visibleVisitedCount = Math.min(stepLimit, maxSteps);
  const visibleVisited = useMemo(
    () => new Set(solved.visited.slice(0, visibleVisitedCount)),
    [solved.visited, visibleVisitedCount]
  );
  const showPath = visibleVisitedCount >= maxSteps;
  const pathSet = useMemo(() => new Set(showPath ? solved.path : []), [solved.path, showPath]);

  useEffect(() => {
    if (!isAnimating) return;
    const id = setInterval(() => {
      setStepLimit((prev) => {
        if (prev >= maxSteps) {
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 90);
    return () => clearInterval(id);
  }, [isAnimating, maxSteps]);

  const toggleCell = (idx: number) => {
    if (idx === START || idx === GOAL) return;
    if (brushMode === 'wall') {
      const next = new Set(walls);
      if (next.has(idx)) next.delete(idx);
      else {
        next.add(idx);
        const wNext = new Set(weighted);
        wNext.delete(idx);
        setWeighted(wNext);
      }
      setWalls(next);
    } else {
      const next = new Set(weighted);
      if (next.has(idx)) next.delete(idx);
      else {
        next.add(idx);
        const wallNext = new Set(walls);
        wallNext.delete(idx);
        setWalls(wallNext);
      }
      setWeighted(next);
    }
  };

  // Segment Tree construction (1-indexed size 16 for 8 elements)
  const segData = useMemo(() => {
    const tree = new Array(16).fill(0);
    for (let i = 0; i < 8; i++) tree[8 + i] = arr[i];
    for (let i = 7; i >= 1; i--) tree[i] = tree[2 * i] + tree[2 * i + 1];

    const usedNodes = new Set<number>();
    const query = (node: number, l: number, r: number, ql: number, qr: number): number => {
      if (qr < l || ql > r) return 0;
      if (ql <= l && r <= qr) {
        usedNodes.add(node);
        return tree[node];
      }
      const mid = Math.floor((l + r) / 2);
      return query(2 * node, l, mid, ql, qr) + query(2 * node + 1, mid + 1, r, ql, qr);
    };
    const safeL = Math.min(queryL, queryR);
    const safeR = Math.max(queryL, queryR);
    const sum = query(1, 0, 7, safeL, safeR);
    return { tree, usedNodes, sum, safeL, safeR };
  }, [arr, queryL, queryR]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            ICT International Coding Test Virtual Lab
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
            Shortest-Path Search (Dijkstra vs BFS) &amp; Segment Tree Range Queries
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Draw walls or high-cost terrain to compare weighted Dijkstra optimality against unweighted BFS, or trace O(log N) Segment Tree splits.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab('graph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'graph' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Graph Search
          </button>
          <button
            type="button"
            onClick={() => setTab('segtree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'segtree' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Segment Tree
          </button>
        </div>
      </div>

      {tab === 'graph' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setAlgo('dijkstra'); setStepLimit(999); setIsAnimating(false); }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                    algo === 'dijkstra'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Dijkstra (Weighted)
                </button>
                <button
                  type="button"
                  onClick={() => { setAlgo('bfs'); setStepLimit(999); setIsAnimating(false); }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                    algo === 'bfs'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  BFS (Unweighted)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBrushMode('wall')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    brushMode === 'wall'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Paint Walls (∞)
                </button>
                <button
                  type="button"
                  onClick={() => setBrushMode('mud')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    brushMode === 'mud'
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Paint Mud (Cost 5)
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAnimating) {
                      if (stepLimit >= maxSteps) setStepLimit(1);
                      setIsAnimating(true);
                    } else {
                      setIsAnimating(false);
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isAnimating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isAnimating ? 'Pause' : 'Animate Search'}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAnimating(false); setStepLimit((s) => Math.min(maxSteps, s >= maxSteps ? 1 : s + 1)); }}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Step forward"
                >
                  <StepForward className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAnimating(false); setWalls(new Set(DEFAULT_WALLS)); setWeighted(new Set(DEFAULT_WEIGHTS)); setStepLimit(999); }}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Reset grid"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Algorithm Path Cost:</span>
                <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {solved.totalCost >= 0 ? solved.totalCost : 'No Path'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nodes Expanded:</span>
                <span className="font-bold tabular-nums">{visibleVisitedCount} / {maxSteps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Path Hops:</span>
                <span className="font-bold tabular-nums">{Math.max(0, solved.path.length - 1)} edges</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
              <span>Click grid cells to toggle {brushMode === 'wall' ? 'walls' : 'weight-5 mud'}</span>
              <span>S = Start · G = Goal · Amber = Cost 5</span>
            </div>

            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: ROWS * COLS }).map((_, idx) => {
                const isStart = idx === START;
                const isGoal = idx === GOAL;
                const isWall = walls.has(idx);
                const isMud = weighted.has(idx);
                const isPath = pathSet.has(idx);
                const isVisited = visibleVisited.has(idx);

                let cls = 'bg-slate-800/80 border-slate-700 text-slate-400';
                if (isWall) cls = 'bg-slate-600 border-slate-500 text-slate-950';
                else if (isStart) cls = 'bg-indigo-600 border-indigo-400 text-white font-black';
                else if (isGoal) cls = 'bg-rose-600 border-rose-400 text-white font-black';
                else if (isPath) cls = 'bg-emerald-500 border-emerald-300 text-slate-950 font-black';
                else if (isMud && isVisited) cls = 'bg-amber-600 border-amber-400 text-white';
                else if (isMud) cls = 'bg-amber-900/70 border-amber-700 text-amber-200';
                else if (isVisited) cls = 'bg-sky-900/80 border-sky-600 text-sky-200';

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleCell(idx)}
                    className={`aspect-square rounded-lg border text-xs font-mono flex items-center justify-center transition-colors cursor-pointer ${cls}`}
                  >
                    {isStart ? 'S' : isGoal ? 'G' : isWall ? '■' : isMud ? '5' : isPath ? '•' : '1'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Range Query Interval [L, R]
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-500 block mb-1">Left L = {segData.safeL}</label>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={queryL}
                    onChange={(e) => setQueryL(Number(e.target.value))}
                    className="w-full h-2 accent-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-500 block mb-1">Right R = {segData.safeR}</label>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={queryR}
                    onChange={(e) => setQueryR(Number(e.target.value))}
                    className="w-full h-2 accent-emerald-600"
                  />
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                Point Update Leaves (Click +1 / -1)
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {arr.map((val, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setArr((prev) => prev.map((v, idx) => (idx === i ? (v % 12) + 1 : v)))}
                    className={`p-2 rounded-lg border text-xs font-mono font-bold cursor-pointer ${
                      i >= segData.safeL && i <= segData.safeR
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    A[{i}]={val}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Query Sum [{segData.safeL}..{segData.safeR}]:</span>
                <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{segData.sum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tree Nodes Visited:</span>
                <span className="font-bold tabular-nums">{segData.usedNodes.size} nodes (O(log N))</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-5 flex flex-col justify-between text-white">
            <div className="text-xs font-mono text-emerald-300 mb-3">
              Binary Segment Tree (Green Nodes = Minimal O(log N) Decomposed Cover)
            </div>
            <div className="space-y-4">
              {[
                [{ idx: 1, label: '0..7' }],
                [{ idx: 2, label: '0..3' }, { idx: 3, label: '4..7' }],
                [{ idx: 4, label: '0..1' }, { idx: 5, label: '2..3' }, { idx: 6, label: '4..5' }, { idx: 7, label: '6..7' }],
                Array.from({ length: 8 }, (_, i) => ({ idx: 8 + i, label: `${i}` })),
              ].map((level, depth) => (
                <div key={depth} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${level.length}, minmax(0, 1fr))` }}>
                  {level.map((node) => {
                    const hit = segData.usedNodes.has(node.idx);
                    return (
                      <div
                        key={node.idx}
                        className={`p-2 rounded-lg border text-center font-mono ${
                          hit
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-[10px] opacity-75">[{node.label}]</div>
                        <div className="text-xs font-black tabular-nums">{segData.tree[node.idx]}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

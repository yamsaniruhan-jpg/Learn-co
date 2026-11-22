export interface ICTTestCase {
  id: string;
  label: string;
  input: any;
  expected: any;
  isHidden?: boolean;
}

export interface ICTCodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  estimatedMinutes: number;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  starterCode: string;
  referenceSolution: string;
  timeComplexity: string;
  spaceComplexity: string;
  sampleCases: ICTTestCase[];
  hiddenCases: ICTTestCase[];
}

export interface ICTCaseResult {
  id: string;
  label: string;
  passed: boolean;
  isHidden: boolean;
  expected: string;
  actual: string;
  durationMs: number;
  error?: string;
}

export interface ICTRunResult {
  success: boolean;
  passedCount: number;
  totalCount: number;
  timedOut: boolean;
  compileError?: string;
  logs: string[];
  totalDurationMs: number;
  caseResults: ICTCaseResult[];
}

export const ICT_CODING_PROBLEMS: ICTCodingProblem[] = [
  {
    id: 'ict-code-two-sum',
    title: '1. Pair Target Sum (Hash Complement)',
    difficulty: 'Easy',
    topic: 'Hash Maps & Arrays',
    estimatedMinutes: 10,
    statement:
      'Given an array of integers `nums` and an integer `target`, return the 0-based indices `[i, j]` (`i < j`) of the two distinct elements whose sum equals `target`. Exactly one valid pair is guaranteed.',
    inputFormat: '`input = { nums: number[], target: number }`',
    outputFormat: 'Return a 2-element array `[i, j]` with `i < j`.',
    constraints: ['2 <= nums.length <= 10^5', '-10^9 <= nums[i], target <= 10^9', 'Target O(N) time complexity'],
    starterCode: `function solve(input) {
  const { nums, target } = input;
  // Return [i, j] with i < j where nums[i] + nums[j] === target
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
    referenceSolution: `function solve(input) {
  const { nums, target } = input;
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (seen.has(comp)) return [seen.get(comp), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    sampleCases: [
      { id: 's1', label: 'Sample 1', input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { id: 's2', label: 'Sample 2', input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
    ],
    hiddenCases: [
      { id: 'h1', label: 'Hidden 1 (Negatives)', input: { nums: [-5, 12, 8, -3], target: -8 }, expected: [0, 3], isHidden: true },
      { id: 'h2', label: 'Hidden 2 (Duplicates)', input: { nums: [3, 3, 9], target: 6 }, expected: [0, 1], isHidden: true },
      { id: 'h3', label: 'Hidden 3 (Large Values)', input: { nums: [1000000, -400, 42, 999600], target: 1999600 }, expected: [0, 3], isHidden: true },
    ],
  },
  {
    id: 'ict-code-kadane',
    title: '2. Maximum Contiguous Subarray (Kadane)',
    difficulty: 'Easy',
    topic: 'Dynamic Programming',
    estimatedMinutes: 12,
    statement:
      'Given a non-empty integer array `nums` (which may contain negative values), find the contiguous non-empty subarray with the largest sum and return its maximum sum.',
    inputFormat: '`input = { nums: number[] }`',
    outputFormat: 'Return a single integer representing the maximum subarray sum.',
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    starterCode: `function solve(input) {
  const { nums } = input;
  // Implement Kadane's O(N) DP recurrence

}`,
    referenceSolution: `function solve(input) {
  const { nums } = input;
  let best = nums[0];
  let curr = nums[0];
  for (let i = 1; i < nums.length; i++) {
    curr = Math.max(nums[i], curr + nums[i]);
    best = Math.max(best, curr);
  }
  return best;
}`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    sampleCases: [
      { id: 's1', label: 'Sample 1', input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expected: 6 },
      { id: 's2', label: 'Sample 2', input: { nums: [5, 4, -1, 7, 8] }, expected: 23 },
    ],
    hiddenCases: [
      { id: 'h1', label: 'Hidden 1 (All Negative)', input: { nums: [-8, -3, -6, -2, -5] }, expected: -2, isHidden: true },
      { id: 'h2', label: 'Hidden 2 (Single)', input: { nums: [-42] }, expected: -42, isHidden: true },
      { id: 'h3', label: 'Hidden 3 (Mixed Peak)', input: { nums: [4, -10, 8, 3, -2, 7, -15, 6] }, expected: 16, isHidden: true },
    ],
  },
  {
    id: 'ict-code-rotated-search',
    title: '3. Search in Rotated Sorted Array',
    difficulty: 'Medium',
    topic: 'Binary Search',
    estimatedMinutes: 15,
    statement:
      'An ascending sorted array of distinct integers has been rotated at an unknown pivot index. Given `nums` and `target`, return the index of `target` in `O(log N)` time, or `-1` if it does not exist.',
    inputFormat: '`input = { nums: number[], target: number }`',
    outputFormat: 'Return 0-based index or `-1`.',
    constraints: ['1 <= nums.length <= 10^5', 'All elements in nums are distinct'],
    starterCode: `function solve(input) {
  const { nums, target } = input;
  let lo = 0, hi = nums.length - 1;
  // Determine which half is strictly sorted on each step
  return -1;
}`,
    referenceSolution: `function solve(input) {
  const { nums, target } = input;
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    sampleCases: [
      { id: 's1', label: 'Sample 1', input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 }, expected: 4 },
      { id: 's2', label: 'Sample 2', input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 }, expected: -1 },
    ],
    hiddenCases: [
      { id: 'h1', label: 'Hidden 1 (Unrotated)', input: { nums: [1, 3, 5, 7, 9], target: 7 }, expected: 3, isHidden: true },
      { id: 'h2', label: 'Hidden 2 (Two Elements)', input: { nums: [3, 1], target: 1 }, expected: 1, isHidden: true },
      { id: 'h3', label: 'Hidden 3 (Pivot Edge)', input: { nums: [15, 18, 2, 3, 6, 12], target: 15 }, expected: 0, isHidden: true },
    ],
  },
  {
    id: 'ict-code-knapsack',
    title: '4. 0/1 Knapsack Optimization',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    estimatedMinutes: 18,
    statement:
      'Given weights `weights[i]` and values `values[i]` for `N` items alongside capacity `capacity`, compute the maximum total value achievable without exceeding `capacity` (each item can be chosen at most once).',
    inputFormat: '`input = { weights: number[], values: number[], capacity: number }`',
    outputFormat: 'Return maximum achievable integer value.',
    constraints: ['1 <= N <= 200', '0 <= capacity <= 5000'],
    starterCode: `function solve(input) {
  const { weights, values, capacity } = input;
  const dp = new Array(capacity + 1).fill(0);
  // Iterate capacity backwards to enforce 0/1 item usage
  return dp[capacity];
}`,
    referenceSolution: `function solve(input) {
  const { weights, values, capacity } = input;
  const dp = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i], v = values[i];
    for (let c = capacity; c >= w; c--) {
      if (dp[c - w] + v > dp[c]) dp[c] = dp[c - w] + v;
    }
  }
  return dp[capacity];
}`,
    timeComplexity: 'O(N * W)',
    spaceComplexity: 'O(W)',
    sampleCases: [
      { id: 's1', label: 'Sample 1', input: { weights: [2, 3, 4, 5], values: [3, 4, 5, 6], capacity: 5 }, expected: 7 },
      { id: 's2', label: 'Sample 2', input: { weights: [1, 2, 3], values: [10, 15, 40], capacity: 6 }, expected: 65 },
    ],
    hiddenCases: [
      { id: 'h1', label: 'Hidden 1 (Zero Cap)', input: { weights: [2, 4], values: [10, 20], capacity: 0 }, expected: 0, isHidden: true },
      { id: 'h2', label: 'Hidden 2 (Greedy Trap)', input: { weights: [10, 20, 30], values: [60, 100, 120], capacity: 50 }, expected: 220, isHidden: true },
      { id: 'h3', label: 'Hidden 3 (Tight Fit)', input: { weights: [4, 5, 3, 7], values: [12, 14, 9, 22], capacity: 10 }, expected: 31, isHidden: true },
    ],
  },
  {
    id: 'ict-code-dijkstra',
    title: '5. Dijkstra Shortest Path in Weighted Graph',
    difficulty: 'Hard',
    topic: 'Graph Algorithms',
    estimatedMinutes: 20,
    statement:
      'Given `n` vertices indexed `0..n-1`, directed non-negative edges `[u, v, w]` in `edges`, a `source`, and a `target`, return the minimum path weight from `source` to `target`, or `-1` if unreachable.',
    inputFormat: '`input = { n: number, edges: [number, number, number][], source: number, target: number }`',
    outputFormat: 'Return minimum shortest-path cost or `-1`.',
    constraints: ['1 <= n <= 2000', '0 <= w <= 10^6'],
    starterCode: `function solve(input) {
  const { n, edges, source, target } = input;
  // Build adjacency list & relax vertices using Dijkstra's greedy selection
  return -1;
}`,
    referenceSolution: `function solve(input) {
  const { n, edges, source, target } = input;
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const dist = new Array(n).fill(Infinity);
  const used = new Array(n).fill(false);
  dist[source] = 0;
  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!used[i] && (u === -1 || dist[i] < dist[u])) u = i;
    }
    if (u === -1 || dist[u] === Infinity) break;
    used[u] = true;
    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
  }
  return dist[target] === Infinity ? -1 : dist[target];
}`,
    timeComplexity: 'O(V^2 + E) or O((V+E) log V)',
    spaceComplexity: 'O(V + E)',
    sampleCases: [
      {
        id: 's1',
        label: 'Sample 1',
        input: { n: 4, edges: [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 5]], source: 0, target: 3 },
        expected: 4,
      },
      {
        id: 's2',
        label: 'Sample 2 (Unreachable)',
        input: { n: 3, edges: [[0, 1, 5]], source: 0, target: 2 },
        expected: -1,
      },
    ],
    hiddenCases: [
      { id: 'h1', label: 'Hidden 1 (Self)', input: { n: 3, edges: [[0, 1, 2]], source: 1, target: 1 }, expected: 0, isHidden: true },
      {
        id: 'h2',
        label: 'Hidden 2 (Multi-hop Shortcut)',
        input: { n: 5, edges: [[0, 1, 10], [0, 2, 2], [2, 3, 2], [3, 4, 2], [4, 1, 2], [1, 4, 1]], source: 0, target: 1 },
        expected: 8,
        isHidden: true,
      },
    ],
  },
  {
    id: 'ict-code-fenwick',
    title: '6. Range Sum Queries via Prefix / Fenwick Updates',
    difficulty: 'Hard',
    topic: 'Trees & Data Structures',
    estimatedMinutes: 20,
    statement:
      'Given an initial array `nums` and a list of operations `ops` where `["add", idx, delta]` adds `delta` to `nums[idx]` and `["sum", l, r]` asks for the inclusive sum `nums[l] + ... + nums[r]`, return an array containing the result of every `"sum"` query in order.',
    inputFormat: '`input = { nums: number[], ops: Array<["add"|"sum", number, number]> }`',
    outputFormat: 'Return `number[]` matching each `"sum"` query.',
    constraints: ['1 <= nums.length <= 5*10^4', '1 <= ops.length <= 5*10^4'],
    starterCode: `function solve(input) {
  const { nums, ops } = input;
  // Use a 1-indexed Binary Indexed Tree (Fenwick Tree) for O(log N) updates & queries
  return [];
}`,
    referenceSolution: `function solve(input) {
  const { nums, ops } = input;
  const n = nums.length;
  const bit = new Array(n + 1).fill(0);
  const add = (i, delta) => {
    for (let k = i + 1; k <= n; k += k & -k) bit[k] += delta;
  };
  const prefix = (i) => {
    let s = 0;
    for (let k = i + 1; k > 0; k -= k & -k) s += bit[k];
    return s;
  };
  for (let i = 0; i < n; i++) add(i, nums[i]);
  const out = [];
  for (const [kind, a, b] of ops) {
    if (kind === 'add') add(a, b);
    else out.push(prefix(b) - (a > 0 ? prefix(a - 1) : 0));
  }
  return out;
}`,
    timeComplexity: 'O((N + Q) log N)',
    spaceComplexity: 'O(N)',
    sampleCases: [
      {
        id: 's1',
        label: 'Sample 1',
        input: { nums: [1, 3, 5, 7, 9], ops: [['sum', 1, 3], ['add', 2, 5], ['sum', 1, 3]] },
        expected: [15, 20],
      },
    ],
    hiddenCases: [
      {
        id: 'h1',
        label: 'Hidden 1 (Zero & Negative Updates)',
        input: { nums: [10, 20, 30, 40], ops: [['sum', 0, 3], ['add', 0, -15], ['add', 3, 10], ['sum', 0, 1], ['sum', 2, 3]] },
        expected: [100, 15, 80],
        isHidden: true,
      },
    ],
  },
];

function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, idx) => deepEqual(v, b[idx]));
  }
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

function formatVal(v: any): string {
  if (v === undefined) return 'undefined';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export async function runICTCodeInSandbox(
  userCode: string,
  cases: ICTTestCase[],
  timeoutMs = 2000
): Promise<ICTRunResult> {
  // Pure fallback for non-browser test runners where Worker is unavailable
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL.createObjectURL !== 'function') {
    const logs: string[] = [];
    const caseResults: ICTCaseResult[] = [];
    const started = performance.now();
    try {
      const factory = new Function(
        'console',
        `"use strict";\n${userCode}\nif (typeof solve !== 'function') { throw new Error('Define function solve(input)'); }\nreturn solve;`
      );
      const solveFn = factory({
        log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      });
      for (const tc of cases) {
        const t0 = performance.now();
        try {
          const actual = solveFn(structuredClone(tc.input));
          const dt = Math.max(0.1, Number((performance.now() - t0).toFixed(2)));
          caseResults.push({
            id: tc.id,
            label: tc.label,
            passed: deepEqual(actual, tc.expected),
            isHidden: Boolean(tc.isHidden),
            expected: formatVal(tc.expected),
            actual: formatVal(actual),
            durationMs: dt,
          });
        } catch (err: any) {
          caseResults.push({
            id: tc.id,
            label: tc.label,
            passed: false,
            isHidden: Boolean(tc.isHidden),
            expected: formatVal(tc.expected),
            actual: 'Runtime Error',
            durationMs: 0,
            error: err?.message || String(err),
          });
        }
      }
      const passedCount = caseResults.filter((r) => r.passed).length;
      return {
        success: passedCount === caseResults.length && caseResults.length > 0,
        passedCount,
        totalCount: caseResults.length,
        timedOut: false,
        logs: logs.slice(0, 50),
        totalDurationMs: Number((performance.now() - started).toFixed(2)),
        caseResults,
      };
    } catch (err: any) {
      return {
        success: false,
        passedCount: 0,
        totalCount: cases.length,
        timedOut: false,
        compileError: err?.message || String(err),
        logs: logs.slice(0, 50),
        totalDurationMs: 0,
        caseResults: [],
      };
    }
  }

  // Isolated Web Worker sandbox for browsers (zero access to window/DOM/localStorage + hard timeout)
  return new Promise<ICTRunResult>((resolve) => {
    const workerSource = `
      const deepEqual = (a, b) => {
        if (Object.is(a, b)) return true;
        if (typeof a !== typeof b || a === null || b === null) return false;
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        if (Array.isArray(a)) {
          if (a.length !== b.length) return false;
          return a.every((v, idx) => deepEqual(v, b[idx]));
        }
        if (typeof a === 'object') {
          const keysA = Object.keys(a), keysB = Object.keys(b);
          if (keysA.length !== keysB.length) return false;
          return keysA.every((k) => deepEqual(a[k], b[k]));
        }
        return false;
      };
      const formatVal = (v) => {
        if (v === undefined) return 'undefined';
        try { return JSON.stringify(v); } catch { return String(v); }
      };
      self.onmessage = (ev) => {
        const { code, testCases } = ev.data;
        const logs = [];
        const started = performance.now();
        const sandboxConsole = {
          log: (...args) => {
            if (logs.length < 50) logs.push(args.map((a) => typeof a === 'object' ? formatVal(a) : String(a)).join(' '));
          }
        };
        let solveFn;
        try {
          const build = new Function('console', '"use strict";\\n' + code + '\\nif (typeof solve !== "function") { throw new Error("Please define function solve(input) { ... }"); }\\nreturn solve;');
          solveFn = build(sandboxConsole);
        } catch (err) {
          self.postMessage({
            success: false,
            passedCount: 0,
            totalCount: testCases.length,
            timedOut: false,
            compileError: err && err.message ? err.message : String(err),
            logs,
            totalDurationMs: 0,
            caseResults: [],
          });
          return;
        }
        const caseResults = [];
        for (const tc of testCases) {
          const t0 = performance.now();
          try {
            const inputCopy = JSON.parse(JSON.stringify(tc.input));
            const actual = solveFn(inputCopy);
            const dt = Math.max(0.1, Number((performance.now() - t0).toFixed(2)));
            caseResults.push({
              id: tc.id,
              label: tc.label,
              passed: deepEqual(actual, tc.expected),
              isHidden: Boolean(tc.isHidden),
              expected: formatVal(tc.expected),
              actual: formatVal(actual),
              durationMs: dt,
            });
          } catch (err) {
            caseResults.push({
              id: tc.id,
              label: tc.label,
              passed: false,
              isHidden: Boolean(tc.isHidden),
              expected: formatVal(tc.expected),
              actual: 'Runtime Error',
              durationMs: 0,
              error: err && err.message ? err.message : String(err),
            });
          }
        }
        const passedCount = caseResults.filter((r) => r.passed).length;
        self.postMessage({
          success: passedCount === caseResults.length && caseResults.length > 0,
          passedCount,
          totalCount: caseResults.length,
          timedOut: false,
          logs,
          totalDurationMs: Number((performance.now() - started).toFixed(2)),
          caseResults,
        });
      };
    `;

    const blob = new Blob([workerSource], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    let settled = false;

    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        success: false,
        passedCount: 0,
        totalCount: cases.length,
        timedOut: true,
        compileError: `Time Limit Exceeded (${(timeoutMs / 1000).toFixed(1)}s). Check for infinite loops or non-optimal time complexity.`,
        logs: [],
        totalDurationMs: timeoutMs,
        caseResults: [],
      });
    }, timeoutMs);

    worker.onmessage = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      resolve(e.data as ICTRunResult);
    };

    worker.onerror = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      resolve({
        success: false,
        passedCount: 0,
        totalCount: cases.length,
        timedOut: false,
        compileError: err?.message || 'Worker sandbox error',
        logs: [],
        totalDurationMs: 0,
        caseResults: [],
      });
    };

    worker.postMessage({ code: userCode, testCases: cases });
  });
}

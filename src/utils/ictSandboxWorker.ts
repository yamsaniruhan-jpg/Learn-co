import { compileSafeSolveFunction } from './safeJsRunner';

const deepEqual = (a: any, b: any): boolean => {
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
};

const formatVal = (v: any): string => {
  if (v === undefined) return 'undefined';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

self.onmessage = (ev: MessageEvent) => {
  const { code, testCases } = ev.data || { code: '', testCases: [] };
  const logs: string[] = [];
  const started = performance.now();
  const sandboxConsole = {
    log: (...args: any[]) => {
      if (logs.length < 50) {
        logs.push(args.map((a) => (typeof a === 'object' ? formatVal(a) : String(a))).join(' '));
      }
    },
  };

  let solveFn: (input: any) => any;
  try {
    solveFn = compileSafeSolveFunction(code, sandboxConsole);
  } catch (err: any) {
    self.postMessage({
      success: false,
      passedCount: 0,
      totalCount: testCases.length,
      timedOut: false,
      compileError: err?.message || String(err),
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

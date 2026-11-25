import { lazy, type ComponentType } from 'react';

const RECOVERABLE_IMPORT_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|Outdated Optimize Dep|NetworkError/i;

/**
 * Retries transient dynamic `import()` errors caused by dev-server restarts,
 * Vite dependency re-optimization, or momentary proxy drops before failing.
 */
export async function retryDynamicImport<T>(
  loader: () => Promise<T>,
  retries: number = 2,
  delayMs: number = 350,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await loader();
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error || '');
      if (attempt < retries && RECOVERABLE_IMPORT_RE.test(msg)) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }
      if (attempt === retries && RECOVERABLE_IMPORT_RE.test(msg) && typeof window !== 'undefined') {
        const reloadKey = 'learnco_chunk_reload_' + window.location.pathname;
        const lastReload = sessionStorage.getItem(reloadKey);
        if (!lastReload || Date.now() - Number(lastReload) > 10000) {
          sessionStorage.setItem(reloadKey, String(Date.now()));
          window.location.reload();
          return new Promise(() => {}) as unknown as T;
        }
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Resolves a named export out of a dynamically imported module.
 *
 * Split out from `lazyNamed` so it can be unit-tested directly: a component that
 * silently resolved to `undefined` would render as a blank tab rather than
 * throwing, which is exactly the kind of bug that only surfaces in the browser.
 */
export async function resolveNamedExport<T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  name: K,
): Promise<ComponentType<any>> {
  const mod = await retryDynamicImport(loader);
  const component = mod[name];
  if (!component) {
    throw new Error(
      `lazyNamed: module does not export "${String(name)}". ` +
        `Available exports: ${Object.keys(mod).join(', ') || '(none)'}`,
    );
  }
  return component as ComponentType<any>;
}

/**
 * `React.lazy` requires a module whose default export is the component, but the
 * views in this app are all named exports. This adapts a named export into the
 * `{ default }` shape that `lazy` expects, so call sites keep their real names.
 *
 * Also adds bounded retry for transient dynamic module fetch failures.
 */
export function lazyNamed<T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  name: K,
) {
  return lazy(async () => ({ default: await resolveNamedExport(loader, name) }));
}

export function lazyWithRetry<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
) {
  return lazy(() => retryDynamicImport(loader));
}

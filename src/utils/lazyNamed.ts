import { lazy, type ComponentType } from 'react';

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
  const mod = await loader();
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
 * The dynamic `import()` is only fetched when the component first renders, which
 * is what moves these views out of the initial bundle.
 */
export function lazyNamed<T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  name: K,
) {
  return lazy(async () => ({ default: await resolveNamedExport(loader, name) }));
}

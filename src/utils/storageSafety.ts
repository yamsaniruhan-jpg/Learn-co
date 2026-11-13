/** Read an array from browser storage without letting corrupt data crash the app. */
export function readStoredArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    // These app-level arrays contain records; skip corrupt null/primitive entries.
    return value.filter((item) => item !== null && typeof item === 'object') as T[];
  } catch {
    return [];
  }
}

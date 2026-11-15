import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('repository Storage policy', () => {
  it('keeps private user paths owner-scoped and denies client writes to public objects', () => {
    // This detects accidental policy edits; it is not a Firebase emulator test.
    const rules = readFileSync('storage.rules', 'utf8');
    expect(rules).toMatch(/match \/users\/\{userId\}\/\{allPaths=\*\*\}\s*\{\s*allow read, write: if request\.auth != null && request\.auth\.uid == userId;/);
    expect(rules).toMatch(/match \/public\/\{allPaths=\*\*\}\s*\{\s*allow read: if true;\s*allow write: if false;/);
  });
});

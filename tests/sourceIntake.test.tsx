// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  auth: { currentUser: null as null | { uid: string; email: string; emailVerified: boolean } },
  user: { email: 'alice@example.test' },
  createSource: vi.fn(), upload: vi.fn(), generate: vi.fn(), status: vi.fn(),
}));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: m.user }) }));
vi.mock('../src/services/firebaseClient', () => ({ auth: m.auth, uploadUserFile: m.upload }));
vi.mock('../src/services/clientFirestoreSync', () => ({ hasMatchingFirebaseIdentity: (a: string, b: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase() }));
vi.mock('../src/services/creatorClient', () => ({ CreatorClient: { createSource: m.createSource } }));
import { SourceIntakePanel } from '../src/components/create/SourceIntakePanel';

let el: HTMLDivElement, root: Root;
beforeEach(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.clearAllMocks(); m.auth.currentUser = null;
  m.createSource.mockResolvedValue({ id: 'src-test' });
  m.upload.mockResolvedValue(undefined); m.generate.mockResolvedValue(undefined);
  el = document.createElement('div'); document.body.appendChild(el); root = createRoot(el);
  await act(async () => root.render(<SourceIntakePanel onGenerate={m.generate} onStorageStatus={m.status} isGenerating={false} isGenerationLimitReached={false} />));
});
afterEach(async () => { await act(async () => root.unmount()); el.remove(); });

async function submitPdf() {
  const button = [...el.querySelectorAll('button')].find(b => b.textContent?.includes('PDF'))!;
  await act(async () => button.click());
  const input = el.querySelector('input[type=file]') as HTMLInputElement;
  Object.defineProperty(input, 'files', { configurable: true, value: [new File(['%PDF-1.4 test'], 'lecture.pdf', { type: 'application/pdf' })] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  await act(async () => { el.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await new Promise(resolve => setTimeout(resolve, 40)); });
}

describe('PDF source intake', () => {
  it('sends actual PDF bytes to the source API and generates from the saved source', async () => {
    await submitPdf();
    expect(m.createSource).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 'pdf', fileName: 'lecture.pdf', fileBase64: expect.stringMatching(/^data:application\/pdf;base64,/) }));
    expect(m.generate).toHaveBeenCalledWith(expect.objectContaining({ sourceId: 'src-test', sourceText: undefined }));
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.status).toHaveBeenLastCalledWith(expect.stringContaining('Firebase copy not saved'));
  });
  it('does not upload to a different or unverified Firebase account', async () => {
    m.auth.currentUser = { uid: 'wrong', email: 'other@example.test', emailVerified: true };
    await submitPdf();
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.generate).toHaveBeenCalledOnce();
  });
  it('uploads to Firebase only for the matching verified identity', async () => {
    m.auth.currentUser = { uid: 'alice', email: 'alice@example.test', emailVerified: true };
    await submitPdf();
    expect(m.upload).toHaveBeenCalledWith('alice', 'src-test', expect.any(File));
    expect(m.status).toHaveBeenLastCalledWith(expect.stringContaining('and Firebase Storage'));
  });
  it('does not mirror an unverified account even if its email matches', async () => {
    m.auth.currentUser = { uid: 'alice', email: 'alice@example.test', emailVerified: false };
    await submitPdf();
    expect(m.upload).not.toHaveBeenCalled();
  });
  it('reports a failed Firebase mirror without discarding the saved source', async () => {
    m.auth.currentUser = { uid: 'alice', email: 'alice@example.test', emailVerified: true };
    m.upload.mockRejectedValue(new Error('permission denied'));
    await submitPdf();
    expect(m.upload).toHaveBeenCalledWith('alice', 'src-test', expect.any(File));
    expect(m.status).toHaveBeenLastCalledWith(expect.stringContaining('Firebase Storage upload failed'));
    expect(m.generate).toHaveBeenCalledOnce();
  });
  it('does not generate or upload if saving the source fails', async () => {
    m.createSource.mockRejectedValue(new Error('Cannot save source'));
    await submitPdf();
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Cannot save source');
    expect(m.upload).not.toHaveBeenCalled(); expect(m.generate).not.toHaveBeenCalled();
  });
});

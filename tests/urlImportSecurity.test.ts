import { afterEach, describe, expect, it, vi } from 'vitest';
import dns from 'node:dns';
import { extractUrlText, isPublicImportAddress, lookupPublicImportHost, htmlToText } from '../server/services/documentExtraction';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('URL import network security', () => {
  it.each(['127.0.0.1', '10.1.2.3', '100.64.1.1', '169.254.169.254', '192.0.2.1', '198.18.0.1', '::1', '::ffff:127.0.0.1', 'fe80::1', 'fc00::1', '2001:db8::1'])('rejects private or special IP %s', address => {
    expect(isPublicImportAddress(address)).toBe(false);
  });
  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('allows globally routable IP %s', address => {
    expect(isPublicImportAddress(address)).toBe(true);
  });
  it('rejects mixed public and private DNS answers instead of connecting', async () => {
    vi.spyOn(dns, 'lookup').mockImplementation(((_host: string, _opts: any, cb: any) => {
      cb(null, [{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }]);
    }) as any);
    const result = await new Promise<any>(resolve => lookupPublicImportHost('mixed.example', { all: true }, err => resolve(err)));
    expect(result.code).toBe('URL_BLOCKED');
    await expect(extractUrlText('http://mixed-forbidden.example.test:3000/private')).rejects.toMatchObject({ code: 'URL_BLOCKED' });
  });
  it('returns the validated IPs to the connection without a second lookup', async () => {
    const spy = vi.spyOn(dns, 'lookup').mockImplementation(((_host: string, _opts: any, cb: any) => {
      cb(null, [{ address: '8.8.8.8', family: 4 }]);
    }) as any);
    const result = await new Promise<any>((resolve, reject) => lookupPublicImportHost('public.example', { all: true }, (err, addresses) => err ? reject(err) : resolve(addresses)));
    expect(result).toEqual([{ address: '8.8.8.8', family: 4 }]);
    expect(spy).toHaveBeenCalledOnce();
  });
  it('limits response bytes during streaming, even without content-length', async () => {
    const data = new Uint8Array(1024 * 1024);
    let sent = 0;
    const body = new ReadableStream({ pull(controller) { if (sent++ < 7) controller.enqueue(data); else controller.close(); } });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200, headers: { 'content-type': 'text/plain' } })));
    await expect(extractUrlText('https://example.com/large')).rejects.toMatchObject({ code: 'URL_TOO_LARGE', status: 413 });
    expect(sent).toBeLessThanOrEqual(7);
  });
  it('does not throw on invalid numeric HTML entities', () => {
    expect(htmlToText('<p>Example &#99999999999; text</p>')).toContain('\ufffd');
  });
});

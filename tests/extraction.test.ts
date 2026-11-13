import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  extractPdfText,
  extractUrlText,
  htmlToText,
  decodeBase64Payload,
  ExtractionError,
} from '../server/services/documentExtraction';

/** Build a minimal but genuinely valid single-page PDF containing `lines`. */
function buildTestPdf(lines: string[]): string {
  const escape = (s: string) => s.replace(/[()\\]/g, '\\$&');
  const stream =
    'BT /F1 12 Tf 72 740 Td 16 TL\n' +
    lines.map((line) => `(${escape(line)}) Tj T*`).join('\n') +
    '\nET';

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1').toString('base64');
}

function stubFetch(impl: (url: string) => Promise<Response> | Response) {
  vi.stubGlobal('fetch', vi.fn((input: any) => Promise.resolve(impl(String(input)))));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('PDF extraction', () => {
  it('extracts the real text layer instead of fabricating content', async () => {
    const base64 = buildTestPdf([
      'Quadratic Equations and the Discriminant',
      'The discriminant is D = b^2 - 4ac.',
      'If D > 0 there are two distinct real roots.',
    ]);

    const result = await extractPdfText(`data:application/pdf;base64,${base64}`);

    expect(result.pageCount).toBe(1);
    expect(result.text).toContain('Quadratic Equations and the Discriminant');
    expect(result.text).toContain('discriminant is D = b^2 - 4ac');
    expect(result.text).toContain('[Page 1]');
    // The old implementation returned placeholder prose; make sure it is gone.
    expect(result.text).not.toContain('Learning Objectives');
    expect(result.text).not.toContain('Key Sections:');
  });

  it('accepts a bare base64 payload without a data URI prefix', async () => {
    const result = await extractPdfText(buildTestPdf(['Standalone payload works.']));
    expect(result.text).toContain('Standalone payload works');
  });

  it('rejects a non-PDF file with a clear 415 instead of inventing text', async () => {
    // 1x1 PNG bytes.
    const png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    await expect(extractPdfText(`data:application/pdf;base64,${png}`)).rejects.toMatchObject({
      name: 'ExtractionError',
      code: 'UNSUPPORTED_FILE_TYPE',
      status: 415,
    });
  });

  it('rejects an unreadable PDF body', async () => {
    const garbage = Buffer.from('%PDF-1.4\nthis is not really a pdf body at all').toString('base64');
    await expect(extractPdfText(garbage)).rejects.toBeInstanceOf(ExtractionError);
  });

  it('rejects empty payloads', async () => {
    await expect(extractPdfText('data:application/pdf;base64,')).rejects.toMatchObject({
      code: 'INVALID_FILE_DATA',
    });
  });

  it('decodes url-safe base64 as well as standard base64', () => {
    const buffer = decodeBase64Payload('data:text/plain;base64,aGVsbG8td29ybGQ_');
    expect(buffer.toString('utf8')).toBe('hello-world?');
  });
});

describe('HTML reduction', () => {
  it('strips scripts, styles and navigation but keeps prose', () => {
    const html = `
      <html><head>
        <style>.a{color:red}</style>
        <script>window.tracker = "leak me";</script>
      </head>
      <body>
        <nav>Home About Login</nav>
        <h1>Newton's Second Law</h1>
        <p>Force equals mass times acceleration: <strong>F = ma</strong>.</p>
        <ul><li>First item</li><li>Second item</li></ul>
        <footer>Copyright 2026</footer>
      </body></html>`;

    const text = htmlToText(html);

    expect(text).toContain("Newton's Second Law");
    expect(text).toContain('F = ma');
    expect(text).toContain('- First item');
    expect(text).not.toContain('leak me');
    expect(text).not.toContain('color:red');
    expect(text).not.toContain('Copyright 2026');
    expect(text).not.toContain('<');
  });

  it('decodes HTML entities', () => {
    expect(htmlToText('<p>a &amp; b &lt; c &mdash; d &#65;</p>')).toBe('a & b < c — d A');
  });
});

describe('URL extraction', () => {
  it('fetches the page and keeps its readable text and title', async () => {
    stubFetch(
      () =>
        new Response(
          `<html><head><title>Thermodynamics Notes</title></head>
           <body><h1>Entropy</h1><p>Entropy is a measure of disorder in a closed system.</p></body></html>`,
          { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
        )
    );

    const result = await extractUrlText('https://example.com/thermo');

    expect(result.title).toBe('Thermodynamics Notes');
    expect(result.text).toContain('Entropy is a measure of disorder');
    expect(result.text).not.toContain('<p>');
  });

  it('prefers og:title over <title>', async () => {
    stubFetch(
      () =>
        new Response(
          `<html><head><title>Site | Generic</title>
           <meta property="og:title" content="Specific Article Title" /></head>
           <body><p>${'Enough real prose to pass the minimum length check. '.repeat(3)}</p></body></html>`,
          { status: 200, headers: { 'content-type': 'text/html' } }
        )
    );

    expect((await extractUrlText('https://example.com/a')).title).toBe('Specific Article Title');
  });

  it('supports plain text responses', async () => {
    stubFetch(
      () =>
        new Response('Plain text study notes about linear algebra and vector spaces.', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        })
    );

    const result = await extractUrlText('https://example.com/notes.txt');
    expect(result.text).toContain('linear algebra');
  });

  it('surfaces an HTTP error instead of fabricating a summary', async () => {
    stubFetch(() => new Response('nope', { status: 404, headers: { 'content-type': 'text/html' } }));

    await expect(extractUrlText('https://example.com/missing')).rejects.toMatchObject({
      code: 'URL_BAD_STATUS',
      status: 502,
    });
  });

  it('rejects non-textual content types', async () => {
    stubFetch(
      () => new Response('%PDF-1.4', { status: 200, headers: { 'content-type': 'application/pdf' } })
    );

    await expect(extractUrlText('https://example.com/file.pdf')).rejects.toMatchObject({
      code: 'URL_NOT_TEXT',
      status: 415,
    });
  });

  it('rejects pages with no meaningful text', async () => {
    stubFetch(
      () =>
        new Response('<html><body><div id="root"></div></body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
    );

    await expect(extractUrlText('https://example.com/spa')).rejects.toMatchObject({
      code: 'URL_NO_TEXT',
    });
  });

  it('reports an unreachable host', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } })))
    );

    await expect(extractUrlText('https://does-not-exist.invalid/x')).rejects.toMatchObject({
      code: 'URL_UNREACHABLE',
    });
  });

  describe('SSRF protection', () => {
    const blocked = [
      'http://127.0.0.1:3000/api/health',
      'http://localhost/admin',
      'http://169.254.169.254/latest/meta-data/',
      'http://10.0.0.5/internal',
      'http://192.168.1.1/router',
      'http://172.16.4.4/x',
      'http://[::1]/x',
      'http://metadata.google.internal/computeMetadata/v1/',
      'file:///etc/passwd',
      'ftp://example.com/file',
    ];

    it.each(blocked)('blocks %s before any request is made', async (url) => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      await expect(extractUrlText(url)).rejects.toBeInstanceOf(ExtractionError);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('blocks a redirect that lands on a private address', async () => {
      stubFetch(
        () =>
          new Response(`<html><body><p>${'text '.repeat(30)}</p></body></html>`, {
            status: 200,
            headers: { 'content-type': 'text/html' },
          })
      );
      // Simulate the final URL after redirects pointing at loopback.
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          const res = new Response(`<html><body><p>${'text '.repeat(30)}</p></body></html>`, {
            status: 200,
            headers: { 'content-type': 'text/html' },
          });
          Object.defineProperty(res, 'url', { value: 'http://127.0.0.1:8080/secret' });
          return res;
        })
      );

      await expect(extractUrlText('https://example.com/redirect')).rejects.toMatchObject({
        code: 'URL_BLOCKED',
      });
    });

    it('rejects malformed URLs', async () => {
      await expect(extractUrlText('not a url')).rejects.toMatchObject({ code: 'INVALID_URL' });
    });
  });
});

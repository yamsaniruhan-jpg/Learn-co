/**
 * Real document extraction for Creator Studio source ingestion.
 *
 * Historically `creatorRoutes` replaced uploaded PDFs and fetched URLs with
 * fabricated placeholder prose, so generated study material had no relation to
 * the user's actual source. This module does the real work:
 *
 *  - PDF  -> text layer extracted page by page with pdfjs-dist
 *  - Text -> validated and trimmed
 *  - URL  -> fetched server-side (with SSRF + size guards), HTML reduced to
 *            readable prose
 *
 * Every path throws a typed `ExtractionError` so routes can return a precise
 * 4xx instead of inventing content.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/build/pdf.mjs';

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB decoded
const MAX_URL_BYTES = 5 * 1024 * 1024; // 5 MB HTML
const MAX_EXTRACTED_CHARS = 200_000;
const URL_TIMEOUT_MS = 15_000;
const MAX_PDF_PAGES = 300;

/**
 * pdfjs needs a directory of standard font metrics to lay out text. Without it
 * it still extracts, but logs "UnknownErrorException" noise on every unmapped
 * font. Resolve the packaged directory once (works from src and dist).
 */
function resolveStandardFontDataUrl(): string | undefined {
  // Probe the filesystem instead of using import.meta/require.resolve so the
  // same file works under the ESM dev server and the CJS production bundle
  // (neither `__dirname` nor `import.meta` is available in both).
  let dir = process.cwd();
  for (let depth = 0; depth < 4; depth += 1) {
    const candidate = path.join(dir, 'node_modules', 'pdfjs-dist', 'standard_fonts');
    if (fs.existsSync(candidate)) return candidate + path.sep;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

const standardFontDataUrl = resolveStandardFontDataUrl();

export class ExtractionError extends Error {
  status: number;
  code: string;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'ExtractionError';
    this.code = code;
    this.status = status;
  }
}

/** Collapse whitespace/nulls that PDF text layers emit, without losing paragraphs. */
function normaliseWhitespace(input: string): string {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Decode a data URI or bare base64 payload into a Buffer. */
export function decodeBase64Payload(raw: string): Buffer {
  const commaIndex = raw.startsWith('data:') ? raw.indexOf(',') : -1;
  const base64 = commaIndex >= 0 ? raw.slice(commaIndex + 1) : raw;

  // Accept URL-safe alphabet and reject stray whitespace before decoding.
  const cleaned = base64.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const buffer = Buffer.from(cleaned, 'base64');

  if (buffer.length === 0) {
    throw new ExtractionError(
      'The uploaded file could not be decoded. Please re-upload the document.',
      'INVALID_FILE_DATA'
    );
  }
  return buffer;
}

/**
 * Extract the text layer from a PDF.
 * @throws {ExtractionError} when the file is not a readable PDF or has no text.
 */
export async function extractPdfText(
  raw: string
): Promise<{ text: string; pageCount: number; truncated: boolean }> {
  const buffer = decodeBase64Payload(raw);

  if (buffer.length > MAX_PDF_BYTES) {
    throw new ExtractionError(
      `PDF is larger than the ${Math.round(MAX_PDF_BYTES / (1024 * 1024))} MB limit.`,
      'FILE_TOO_LARGE',
      413
    );
  }

  // %PDF- magic bytes; reject images/docx renamed to .pdf early with a clear message.
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new ExtractionError(
      'That file is not a valid PDF. DOCX and other formats are not supported yet — please export to PDF or paste the text.',
      'UNSUPPORTED_FILE_TYPE',
      415
    );
  }

  let doc;
  let loadingTask: ReturnType<typeof getDocument> | undefined;
  try {
    const params = {
      // pdfjs transfers ownership of the buffer, so hand it a copy.
      data: new Uint8Array(buffer),
      isEvalSupported: false,
      useSystemFonts: false,
      disableFontFace: true,
      ...(standardFontDataUrl ? { standardFontDataUrl } : {}),
    };
    loadingTask = getDocument(params as Parameters<typeof getDocument>[0]);
    doc = await loadingTask.promise;
  } catch (err) {
    await loadingTask?.destroy().catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    if (/password/i.test(message)) {
      throw new ExtractionError(
        'This PDF is password protected. Please remove the password and upload again.',
        'PDF_ENCRYPTED'
      );
    }
    throw new ExtractionError(
      'The PDF could not be read. It may be corrupted or an unsupported variant.',
      'PDF_UNREADABLE'
    );
  }

  const pagesToRead = Math.min(doc.numPages, MAX_PDF_PAGES);
  const chunks: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        // TextItem carries `str`; TextMarkedContent does not.
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      if (pageText.trim()) {
        chunks.push(`[Page ${pageNumber}]\n${pageText}`);
      }
      page.cleanup();
    }
  } finally {
    await loadingTask!.destroy();
  }

  const text = normaliseWhitespace(chunks.join('\n\n'));

  if (!text) {
    throw new ExtractionError(
      'No selectable text found in this PDF. It is likely a scanned document — run OCR on it or paste the text instead.',
      'PDF_NO_TEXT_LAYER',
      422
    );
  }

  return {
    text: text.slice(0, MAX_EXTRACTED_CHARS),
    pageCount: doc.numPages,
    truncated: doc.numPages > pagesToRead || text.length > MAX_EXTRACTED_CHARS,
  };
}

/** Block loopback/private/link-local targets so a URL intake can't probe the network. */
function assertPublicHost(hostname: string): void {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host.endsWith('.local')
  ) {
    throw new ExtractionError('That URL points to a private address.', 'URL_BLOCKED');
  }

  // IPv4 literal checks.
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    const isPrivate =
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224;
    if (isPrivate) {
      throw new ExtractionError('That URL points to a private address.', 'URL_BLOCKED');
    }
  }

  // IPv6 loopback / unique-local / link-local.
  if (host.includes(':')) {
    if (
      host === '::1' ||
      host === '::' ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe80')
    ) {
      throw new ExtractionError('That URL points to a private address.', 'URL_BLOCKED');
    }
  }
}

/** Reduce an HTML document to readable prose without pulling in a parser dependency. */
export function htmlToText(html: string): string {
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe|nav|footer|form)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<head\b[\s\S]*?<\/head>/gi, ' ');

  const withStructure = withoutNoise
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '- ');

  const stripped = withStructure.replace(/<[^>]+>/g, ' ');

  const decoded = stripped
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&[a-z]+;/gi, ' ');

  return normaliseWhitespace(decoded);
}

/** Pull the most descriptive title out of a page's metadata. */
function extractHtmlTitle(html: string): string | null {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (og?.[1]?.trim()) return og[1].trim();

  const title = html.match(/<title[^>]*>([\s\S]{1,300}?)<\/title>/i);
  if (title?.[1]?.trim()) return title[1].replace(/\s+/g, ' ').trim();

  const h1 = html.match(/<h1[^>]*>([\s\S]{1,300}?)<\/h1>/i);
  if (h1?.[1]) {
    const text = htmlToText(h1[1]);
    if (text) return text;
  }
  return null;
}

/**
 * Fetch a web page and return its readable text plus a metadata title.
 * @throws {ExtractionError} on blocked targets, timeouts, or non-text responses.
 */
export async function extractUrlText(
  rawUrl: string,
  signal?: AbortSignal
): Promise<{ text: string; title: string | null; finalUrl: string; truncated: boolean }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ExtractionError(
      'That does not look like a valid URL.',
      'INVALID_URL'
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ExtractionError(
      'Only http and https links can be imported.',
      'UNSUPPORTED_PROTOCOL'
    );
  }

  assertPublicHost(parsed.hostname);

  const timeoutSignal = AbortSignal.timeout(URL_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let response: globalThis.Response;
  try {
    response = await fetch(parsed.toString(), {
      signal: combined,
      redirect: 'follow',
      headers: {
        // Identify the crawler and ask for HTML; many sites 403 a blank UA.
        'User-Agent': 'LearnCo-ResourceImporter/1.0 (+https://learn.co)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/abort|timeout/i.test(message)) {
      throw new ExtractionError(
        'That page took too long to respond. Try again or paste the text instead.',
        'URL_TIMEOUT',
        504
      );
    }
    throw new ExtractionError(
      'That page could not be reached. Check the link and try again.',
      'URL_UNREACHABLE',
      502
    );
  }

  if (!response.ok) {
    throw new ExtractionError(
      `That page responded with HTTP ${response.status}. It may be private or removed.`,
      'URL_BAD_STATUS',
      502
    );
  }

  // Re-check the final URL: a redirect can land on an internal address.
  assertPublicHost(new URL(response.url || parsed.toString()).hostname);

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const isTextual =
    contentType.includes('text/html') ||
    contentType.includes('application/xhtml') ||
    contentType.includes('text/plain') ||
    contentType.includes('application/xml') ||
    contentType.includes('text/xml');

  if (!isTextual) {
    throw new ExtractionError(
      `That link is ${contentType.split(';')[0] || 'not a web page'} — only HTML and text pages can be imported.`,
      'URL_NOT_TEXT',
      415
    );
  }

  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_URL_BYTES) {
    throw new ExtractionError('That page is too large to import.', 'URL_TOO_LARGE', 413);
  }

  const raw = await response.text();
  if (raw.length > MAX_URL_BYTES) {
    throw new ExtractionError('That page is too large to import.', 'URL_TOO_LARGE', 413);
  }

  const isPlain = contentType.includes('text/plain');
  const title = isPlain ? null : extractHtmlTitle(raw);
  const text = normaliseWhitespace(isPlain ? raw : htmlToText(raw));

  if (text.length < 40) {
    throw new ExtractionError(
      'That page had almost no readable text. It may require a login or be rendered by JavaScript.',
      'URL_NO_TEXT',
      422
    );
  }

  return {
    text: text.slice(0, MAX_EXTRACTED_CHARS),
    title,
    finalUrl: response.url || parsed.toString(),
    truncated: text.length > MAX_EXTRACTED_CHARS,
  };
}

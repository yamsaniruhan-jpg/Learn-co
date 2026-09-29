/**
 * Academic Citation & Zotero Reference Integration Suite
 * Supports APA 7th, MLA 9th, Chicago 17th, IEEE, BibTeX, RIS, and Zotero Web API v3 schemas.
 */

export interface CitationItem {
  id: string;
  itemType: 'book' | 'bookSection' | 'journalArticle' | 'conferencePaper' | 'report';
  title: string;
  authors: string[];
  publicationTitle?: string;
  bookTitle?: string;
  publisher?: string;
  publicationYear: number | string;
  date?: string;
  doi?: string;
  isbn?: string;
  url?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  abstractNote?: string;
  tags?: string[];
  collections?: string[];
}

export interface ZoteroCollection {
  key: string;
  name: string;
  parentCollection?: string;
  numItems?: number;
}

export const DEFAULT_STEM_COLLECTIONS: ZoteroCollection[] = [
  { key: 'col_stem_all', name: '📚 STEM Master Curriculum', numItems: 26 },
  { key: 'col_math_analysis', name: '📐 Mathematics & Real Analysis', numItems: 6 },
  { key: 'col_cs_systems', name: '💻 Computer Science & Distributed Systems', numItems: 5 },
  { key: 'col_physics_quantum', name: '⚛️ Physics & Quantum Mechanics', numItems: 5 },
  { key: 'col_chem_organic', name: '🧪 Chemistry & Molecular Geometry', numItems: 5 },
  { key: 'col_bio_genetics', name: '🧬 Biology, Genetics & Physiology', numItems: 5 },
];

/**
 * Clean author string into an array of author names.
 */
export function parseAuthors(authorsInput: string | string[]): string[] {
  if (Array.isArray(authorsInput)) return authorsInput;
  if (!authorsInput) return ['Anonymous'];

  return authorsInput
    .split(/&|, and | and |;/)
    .map((a) => a.trim())
    .filter(Boolean);
}

/**
 * Format author list for APA: "Stewart, J., & Rudin, W."
 */
export function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 0) return 'Anonymous';
  const formatted = authors.map((name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const initials = parts
      .slice(0, -1)
      .map((p) => `${p[0]}.`)
      .join(' ');
    return `${lastName}, ${initials}`;
  });

  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
}

/**
 * Format author list for MLA: "Stewart, James, and Walter Rudin."
 */
export function formatAuthorsMLA(authors: string[]): string {
  if (authors.length === 0) return 'Anonymous.';
  const formatted = authors.map((name, idx) => {
    const parts = name.trim().split(/\s+/);
    if (idx === 0 && parts.length > 1) {
      const lastName = parts[parts.length - 1];
      const firstName = parts.slice(0, -1).join(' ');
      return `${lastName}, ${firstName}`;
    }
    return name;
  });

  if (formatted.length === 1) return `${formatted[0]}.`;
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}.`;
  return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}.`;
}

/**
 * Format author list for IEEE: "J. Stewart and W. Rudin"
 */
export function formatAuthorsIEEE(authors: string[]): string {
  if (authors.length === 0) return 'Anonymous';
  const formatted = authors.map((name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const initials = parts
      .slice(0, -1)
      .map((p) => `${p[0]}.`)
      .join(' ');
    return `${initials} ${lastName}`;
  });

  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
}

/**
 * Generate Citation in APA 7th Edition format
 */
export function generateAPACitation(item: CitationItem): string {
  const authorStr = formatAuthorsAPA(item.authors);
  const year = item.publicationYear || 'n.d.';
  const title = item.title;
  const publisher = item.publisher ? ` ${item.publisher}.` : '';
  const doi = item.doi ? ` https://doi.org/${item.doi}` : item.url ? ` ${item.url}` : '';

  if (item.itemType === 'bookSection' && item.bookTitle) {
    return `${authorStr} (${year}). ${title}. In *${item.bookTitle}*${publisher}${doi}`;
  }

  return `${authorStr} (${year}). *${title}* (Pedagogical Edition).${publisher}${doi}`;
}

/**
 * Generate Citation in MLA 9th Edition format
 */
export function generateMLACitation(item: CitationItem): string {
  const authorStr = formatAuthorsMLA(item.authors);
  const title = `"${item.title}."`;
  const container = item.bookTitle ? ` *${item.bookTitle}*,` : ` *${item.title}*,`;
  const publisher = item.publisher ? ` ${item.publisher},` : '';
  const year = ` ${item.publicationYear || '2024'}.`;
  const doi = item.doi ? ` DOI: ${item.doi}.` : '';

  return `${authorStr} ${item.itemType === 'bookSection' ? title : ''}${container}${publisher}${year}${doi}`;
}

/**
 * Generate Citation in Chicago 17th Edition format
 */
export function generateChicagoCitation(item: CitationItem): string {
  const authorStr = formatAuthorsMLA(item.authors);
  const year = item.publicationYear || '2024';
  const title = item.itemType === 'bookSection' ? `"${item.title}."` : `*${item.title}*`;
  const book = item.bookTitle ? ` In *${item.bookTitle}*.` : '';
  const publisher = item.publisher ? ` ${item.publisher}, ${year}.` : ` ${year}.`;
  const doi = item.doi ? ` https://doi.org/${item.doi}.` : '';

  return `${authorStr} ${title}.${book}${publisher}${doi}`;
}

/**
 * Generate Citation in IEEE format
 */
export function generateIEEECitation(item: CitationItem, indexNumber = 1): string {
  const authorStr = formatAuthorsIEEE(item.authors);
  const title = item.itemType === 'bookSection' ? `"${item.title},"` : `*${item.title}*,`;
  const container = item.bookTitle ? ` in *${item.bookTitle}*,` : '';
  const pub = item.publisher ? ` ${item.publisher},` : '';
  const year = ` ${item.publicationYear || '2024'}.`;
  const doi = item.doi ? ` doi: ${item.doi}.` : '';

  return `[${indexNumber}] ${authorStr}, ${title}${container}${pub}${year}${doi}`;
}

/**
 * Generate a clean citation key for BibTeX
 */
export function generateBibtexKey(item: CitationItem): string {
  const primaryAuthor = item.authors[0]
    ? item.authors[0].split(/\s+/).pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
    : 'stem';
  const year = item.publicationYear ? String(item.publicationYear).slice(-2) : '24';
  const titleWord = item.title.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'ref';
  return `${primaryAuthor}${year}${titleWord}`;
}

/**
 * Generate standard BibTeX entry
 */
export function generateBibTeX(item: CitationItem): string {
  const citeKey = generateBibtexKey(item);
  const authorField = item.authors.join(' and ');
  const year = item.publicationYear || '2024';
  const type =
    item.itemType === 'bookSection'
      ? 'incollection'
      : item.itemType === 'journalArticle'
      ? 'article'
      : 'book';

  const lines = [
    `@${type}{${citeKey},`,
    `  title     = {${item.title}},`,
    `  author    = {${authorField}},`,
    `  year      = {${year}},`,
  ];

  if (item.bookTitle) lines.push(`  booktitle = {${item.bookTitle}},`);
  if (item.publisher) lines.push(`  publisher = {${item.publisher}},`);
  if (item.doi) lines.push(`  doi       = {${item.doi}},`);
  if (item.isbn) lines.push(`  isbn      = {${item.isbn}},`);
  if (item.url) lines.push(`  url       = {${item.url}},`);
  if (item.abstractNote) lines.push(`  abstract  = {${item.abstractNote.replace(/[{}%]/g, '')}},`);

  lines.push(`}`);
  return lines.join('\n');
}

/**
 * Generate RIS format (for EndNote, Mendeley, Zotero, RefWorks)
 */
export function generateRIS(item: CitationItem): string {
  const typeTag =
    item.itemType === 'bookSection' ? 'CHAP' : item.itemType === 'journalArticle' ? 'JOUR' : 'BOOK';
  const lines: string[] = [`TY  - ${typeTag}`, `TI  - ${item.title}`];

  item.authors.forEach((author) => {
    lines.push(`AU  - ${author}`);
  });

  if (item.publicationYear) lines.push(`PY  - ${item.publicationYear}`);
  if (item.bookTitle) lines.push(`T2  - ${item.bookTitle}`);
  if (item.publisher) lines.push(`PB  - ${item.publisher}`);
  if (item.doi) lines.push(`DO  - ${item.doi}`);
  if (item.isbn) lines.push(`SN  - ${item.isbn}`);
  if (item.url) lines.push(`UR  - ${item.url}`);
  if (item.abstractNote) lines.push(`AB  - ${item.abstractNote}`);

  lines.push('ER  - ');
  return lines.join('\n');
}

/**
 * Generate Zotero Web API v3 Item Payload
 */
export function generateZoteroItemJson(item: CitationItem, targetCollectionKey?: string): object {
  const creators = item.authors.map((name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return { creatorType: 'author', name: parts[0] };
    }
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return {
      creatorType: 'author',
      firstName,
      lastName,
    };
  });

  const baseItem: any = {
    itemType:
      item.itemType === 'bookSection'
        ? 'bookSection'
        : item.itemType === 'journalArticle'
        ? 'journalArticle'
        : 'book',
    title: item.title,
    creators,
    abstractNote: item.abstractNote || '',
    date: String(item.publicationYear || '2024'),
    publisher: item.publisher || 'STEM Archive Open Curriculum',
    extra: `Curated STEM Invariant & Olympiad Master Collection`,
    tags: (item.tags || []).map((t) => ({ tag: t })),
  };

  if (targetCollectionKey && targetCollectionKey !== 'col_stem_all') {
    baseItem.collections = [targetCollectionKey];
  } else if (item.collections && item.collections.length > 0) {
    baseItem.collections = item.collections;
  }

  if (item.bookTitle) baseItem.bookTitle = item.bookTitle;
  if (item.doi) baseItem.DOI = item.doi;
  if (item.isbn) baseItem.ISBN = item.isbn;
  if (item.url) baseItem.url = item.url;

  return [baseItem];
}

/**
 * Storage helpers for Zotero user credentials in localStorage
 */
const ZOTERO_STORAGE_KEY = 'learnco_zotero_config';

export interface ZoteroConfig {
  apiKey: string;
  userId: string;
  libraryType: 'user' | 'group';
  selectedCollectionKey?: string;
  autoSyncEnabled?: boolean;
}

export function loadZoteroConfig(): ZoteroConfig {
  if (typeof window === 'undefined') {
    return { apiKey: '', userId: '', libraryType: 'user', selectedCollectionKey: 'col_stem_all' };
  }
  try {
    const raw = localStorage.getItem(ZOTERO_STORAGE_KEY);
    if (!raw) return { apiKey: '', userId: '', libraryType: 'user', selectedCollectionKey: 'col_stem_all' };
    return JSON.parse(raw);
  } catch {
    return { apiKey: '', userId: '', libraryType: 'user', selectedCollectionKey: 'col_stem_all' };
  }
}

export function saveZoteroConfig(config: ZoteroConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ZOTERO_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Zotero configuration:', e);
  }
}

/**
 * Fetch remote collections from Zotero Web API with offline fallback
 */
export async function fetchZoteroCollections(
  config: ZoteroConfig
): Promise<{ success: boolean; collections: ZoteroCollection[]; error?: string }> {
  if (!config.apiKey || !config.userId) {
    return { success: true, collections: DEFAULT_STEM_COLLECTIONS };
  }

  const endpoint =
    config.libraryType === 'group'
      ? `https://api.zotero.org/groups/${config.userId}/collections`
      : `https://api.zotero.org/users/${config.userId}/collections`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        'Zotero-API-Key': config.apiKey,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const fetched: ZoteroCollection[] = data.map((c: any) => ({
          key: c.key || c.data?.key,
          name: c.data?.name || c.name || 'Unnamed Collection',
          parentCollection: c.data?.parentCollection,
          numItems: c.meta?.numItems || 0,
        }));
        return { success: true, collections: [...DEFAULT_STEM_COLLECTIONS, ...fetched] };
      }
    }
    return { success: true, collections: DEFAULT_STEM_COLLECTIONS };
  } catch (err: any) {
    return { success: true, collections: DEFAULT_STEM_COLLECTIONS, error: err.message };
  }
}

/**
 * Direct sync push to Zotero Web API with subfolder collection support
 */
export async function pushItemToZotero(
  item: CitationItem,
  config: ZoteroConfig,
  collectionKey?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!config.apiKey || !config.userId) {
    return {
      success: false,
      message: 'Please provide your Zotero User ID and API Key to sync with your Zotero cloud library.',
    };
  }

  const endpoint =
    config.libraryType === 'group'
      ? `https://api.zotero.org/groups/${config.userId}/items`
      : `https://api.zotero.org/users/${config.userId}/items`;

  const payload = generateZoteroItemJson(item, collectionKey || config.selectedCollectionKey);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Zotero-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 200 || response.status === 201) {
      const data = await response.json();
      return {
        success: true,
        message: `Successfully saved "${item.title}" into your Zotero collection!`,
        data,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `Zotero API returned status ${response.status}: ${errorText || 'Authentication or permissions error.'}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Network error connecting to Zotero API: ${err.message || 'Check your internet connection.'}`,
    };
  }
}

/**
 * Trigger browser file download for .bib or .ris files
 */
export function downloadCitationFile(filename: string, content: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

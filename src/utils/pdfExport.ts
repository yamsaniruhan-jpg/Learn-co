import { CreatorResource, SlideItem } from '../types/creator';
import { MistakeRecord } from '../types/auth';
import { toCleanDocumentText, resourceToPlainText } from './textSanitizer';

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBrandLogoUrl(): string {
  if (typeof window === 'undefined') return '/logo-mark.png';
  return `${window.location.origin}/logo-mark.png`;
}

function renderDocumentShell(title: string, subtitle: string, bodyHtml: string): string {
  const logoUrl = escapeHtml(getBrandLogoUrl());
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} — LearnCo</title>
  <style>
    @page { margin: 16mm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e1b33;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      line-height: 1.55;
      font-size: 13px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #e3dff5;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand img {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      object-fit: cover;
      background: #01000e;
    }
    .brand-name {
      font-weight: 800;
      font-size: 16px;
      color: #2d2a4a;
    }
    .meta {
      font-size: 11px;
      color: #6b6890;
      text-align: right;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 21px;
      font-weight: 800;
      color: #2d2a4a;
    }
    .subtitle {
      margin: 0 0 18px;
      font-size: 12px;
      color: #6b6890;
    }
    .card {
      border: 1px solid #e3dff5;
      border-radius: 16px;
      padding: 16px 18px;
      margin-bottom: 14px;
      page-break-inside: avoid;
      background: #fdfcff;
    }
    .card-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6c5ce7;
      background: #f0edfa;
      padding: 3px 9px;
      border-radius: 999px;
      margin-bottom: 8px;
    }
    .card h2 {
      margin: 0 0 6px;
      font-size: 16px;
      font-weight: 800;
      color: #1e1b33;
    }
    .card-sub {
      margin: 0 0 10px;
      font-size: 12px;
      color: #5b4bc4;
      font-weight: 600;
    }
    ul {
      margin: 6px 0 10px;
      padding-left: 18px;
    }
    li {
      margin-bottom: 5px;
    }
    .formula-box {
      background: #f0edfa;
      border: 1px solid #d4cef4;
      border-radius: 12px;
      padding: 10px 14px;
      margin: 10px 0;
      font-weight: 700;
      color: #2d2a4a;
    }
    .notes-box {
      background: #fff9eb;
      border: 1px solid #f7dfaa;
      border-radius: 12px;
      padding: 10px 14px;
      margin-top: 10px;
      font-size: 12px;
      color: #4f3a12;
    }
    .answer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 10px 0;
    }
    .answer-wrong {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      border-radius: 12px;
      padding: 10px;
    }
    .answer-right {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 10px;
    }
    .label {
      display: block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 3px;
      opacity: 0.75;
    }
    pre.plain {
      white-space: pre-wrap;
      font-family: inherit;
      margin: 0;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img src="${logoUrl}" alt="LearnCo" />
      <span class="brand-name">LearnCo</span>
    </div>
    <div class="meta">
      <div>${escapeHtml(subtitle)}</div>
      <div>Exported ${escapeHtml(new Date().toLocaleDateString())}</div>
    </div>
  </div>
  <h1>${escapeHtml(title)}</h1>
  <p class="subtitle">Clean Normal-Format Study Handout (No Raw LaTeX Markup)</p>
  ${bodyHtml}
</body>
</html>`;
}

/**
 * Triggers the browser's Print / Save-as-PDF dialog using a hidden iframe
 * so the main app chrome and dark overlay are never printed.
 */
function printHtmlViaHiddenFrame(html: string): boolean {
  if (typeof document === 'undefined') return false;
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };

  iframe.contentWindow.onafterprint = cleanup;
  window.setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(cleanup, 2500);
    }
  }, 150);

  return true;
}

export function printCleanSlidesPdf(slides: SlideItem[], title = 'LearnCo Presentation Slides'): boolean {
  const cleanTitle = toCleanDocumentText(title);
  const bodyHtml = slides
    .map((slide, idx) => {
      const bulletsHtml =
        slide.bullets && slide.bullets.length > 0
          ? `<ul>${slide.bullets.map((b) => `<li>${escapeHtml(toCleanDocumentText(b))}</li>`).join('')}</ul>`
          : '';
      const formulaHtml = slide.calloutFormula
        ? `<div class="formula-box"><span class="label">Key Formula</span>${escapeHtml(toCleanDocumentText(slide.calloutFormula))}</div>`
        : '';
      const notesHtml = slide.speakerNotes
        ? `<div class="notes-box"><span class="label">Speaker Notes</span>${escapeHtml(toCleanDocumentText(slide.speakerNotes))}</div>`
        : '';

      return `
        <div class="card">
          <div class="card-badge">Slide ${idx + 1} of ${slides.length}</div>
          <h2>${escapeHtml(toCleanDocumentText(slide.title))}</h2>
          ${slide.subtitle ? `<p class="card-sub">${escapeHtml(toCleanDocumentText(slide.subtitle))}</p>` : ''}
          ${bulletsHtml}
          ${formulaHtml}
          ${notesHtml}
        </div>
      `;
    })
    .join('');

  const html = renderDocumentShell(cleanTitle, `Presenter Deck • ${slides.length} Slides`, bodyHtml);
  return printHtmlViaHiddenFrame(html);
}

export function printCleanResourcePdf(resource: CreatorResource): boolean {
  if (resource.resourceType === 'slides' && Array.isArray(resource.content.slides)) {
    return printCleanSlidesPdf(resource.content.slides, resource.title);
  }
  const cleanText = resourceToPlainText(resource);
  const bodyHtml = `<div class="card"><pre class="plain">${escapeHtml(cleanText)}</pre></div>`;
  const html = renderDocumentShell(
    toCleanDocumentText(resource.title),
    `${resource.resourceType.replace(/_/g, ' ').toUpperCase()} • ${resource.subjectId.toUpperCase()}`,
    bodyHtml
  );
  return printHtmlViaHiddenFrame(html);
}

export function printCleanMistakeNotebookPdf(mistakes: MistakeRecord[]): boolean {
  const bodyHtml =
    mistakes.length === 0
      ? `<div class="card"><p>No mistakes match the selected filter.</p></div>`
      : mistakes
          .map(
            (m, idx) => `
          <div class="card">
            <div class="card-badge">Item ${idx + 1} • ${escapeHtml(m.subjectId.toUpperCase())} • ${m.resolved ? 'Resolved' : 'Needs Review'}</div>
            <h2>${escapeHtml(toCleanDocumentText(m.topicId || 'Concept Review'))}</h2>
            <p><strong>Question:</strong> ${escapeHtml(toCleanDocumentText(m.questionText))}</p>
            <div class="answer-grid">
              <div class="answer-wrong">
                <span class="label">Your Answer</span>
                ${escapeHtml(toCleanDocumentText(String(m.userAnswer ?? 'Incorrect option')))}
              </div>
              <div class="answer-right">
                <span class="label">Correct Solution</span>
                ${escapeHtml(toCleanDocumentText(String(m.correctAnswer ?? '')))}
              </div>
            </div>
            ${
              m.explanation
                ? `<div class="notes-box"><span class="label">Explanation</span>${escapeHtml(toCleanDocumentText(m.explanation))}</div>`
                : ''
            }
          </div>
        `
          )
          .join('');

  const html = renderDocumentShell(
    'LearnCo Mistake Notebook Report',
    `${mistakes.length} Diagnostic Item${mistakes.length === 1 ? '' : 's'}`,
    bodyHtml
  );
  return printHtmlViaHiddenFrame(html);
}

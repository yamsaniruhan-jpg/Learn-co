import type { CopilotImageAttachment } from '../types/copilot';

const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_DIMENSION = 1024;
const MAX_BYTES = 4 * 1024 * 1024;
// Keep base64 payload comfortably inside the server's 100 KB global JSON limit alongside prompt & history.
export const MAX_SAFE_IMAGE_BASE64_CHARS = 64_000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

export async function prepareQuestionImage(
  file: File
): Promise<{ attachment: CopilotImageAttachment; previewUrl: string }> {
  const mimeType = file.type as CopilotImageAttachment['mimeType'];
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    throw new Error('Please choose a PNG, JPEG, or WebP screenshot/photo.');
  }

  if (file.size > MAX_BYTES * 2) {
    throw new Error('Image is too large. Please upload a file under 8 MB.');
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const rawBase64 = rawDataUrl.split(',')[1] || '';
  if (rawBase64 && rawBase64.length <= MAX_SAFE_IMAGE_BASE64_CHARS) {
    return {
      attachment: { mimeType, data: rawBase64, name: file.name },
      previewUrl: rawDataUrl,
    };
  }

  // Downscale & compress in browser canvas so JSON payload stays within the 100 KB API limit.
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Invalid image file.'));
    el.src = rawDataUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Image exceeds the 100 KB upload budget and cannot be compressed in this browser.');
  }

  const dimensionSteps = [MAX_DIMENSION, 768, 560, 400];
  const qualitySteps = [0.8, 0.65, 0.5, 0.35];

  let bestUrl = '';
  let bestBase64 = '';
  for (const maxDim of dimensionSteps) {
    const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of qualitySteps) {
      const compressedUrl = canvas.toDataURL('image/jpeg', quality);
      const compressedBase64 = compressedUrl.split(',')[1] || '';
      if (compressedBase64 && (!bestBase64 || compressedBase64.length < bestBase64.length)) {
        bestUrl = compressedUrl;
        bestBase64 = compressedBase64;
      }
      if (compressedBase64 && compressedBase64.length <= MAX_SAFE_IMAGE_BASE64_CHARS) {
        return {
          attachment: { mimeType: 'image/jpeg', data: compressedBase64, name: file.name },
          previewUrl: compressedUrl,
        };
      }
    }
  }

  if (!bestBase64 || bestBase64.length > MAX_SAFE_IMAGE_BASE64_CHARS) {
    throw new Error('Could not compress image small enough for upload. Please crop tightly around the question.');
  }

  return {
    attachment: { mimeType: 'image/jpeg', data: bestBase64, name: file.name },
    previewUrl: bestUrl,
  };
}

import type { CopilotImageAttachment } from '../types/copilot';

const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_DIMENSION = 1024;
const MAX_BYTES = 4 * 1024 * 1024;
// Large upload parser on /api/copilot/chat and /api/copilot/stream handles up to 10 MB.
export const MAX_SAFE_IMAGE_BASE64_CHARS = 4_000_000;

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
  const mimeType = (file.type || 'image/jpeg') as CopilotImageAttachment['mimeType'];
  const isSupported = SUPPORTED_IMAGE_TYPES.has(mimeType) || file.type.startsWith('image/');
  if (!isSupported) {
    throw new Error('Please choose an image or photo of your question.');
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Image is too large. Please upload a file under 20 MB.');
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const rawBase64 = rawDataUrl.split(',')[1] || '';
  if (SUPPORTED_IMAGE_TYPES.has(mimeType) && rawBase64 && rawBase64.length <= 1_200_000) {
    return {
      attachment: { mimeType, data: rawBase64, name: file.name },
      previewUrl: rawDataUrl,
    };
  }

  // Downscale & compress in browser canvas so high-resolution camera photos remain crisp for OCR.
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Invalid image file.'));
    el.src = rawDataUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      attachment: { mimeType: 'image/jpeg', data: rawBase64, name: file.name },
      previewUrl: rawDataUrl,
    };
  }

  const dimensionSteps = [1600, 1280, 1024, 768];
  const qualitySteps = [0.85, 0.75, 0.65];

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

  return {
    attachment: { mimeType: 'image/jpeg', data: bestBase64 || rawBase64, name: file.name },
    previewUrl: bestUrl || rawDataUrl,
  };
}

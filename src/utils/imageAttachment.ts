import type { CopilotImageAttachment } from '../types/copilot';

const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_DIMENSION = 1400;
const MAX_BYTES = 4 * 1024 * 1024;

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

  const rawDataUrl = await readFileAsDataUrl(file);
  if (file.size <= 900_000) {
    const base64 = rawDataUrl.split(',')[1] || '';
    return {
      attachment: { mimeType, data: base64, name: file.name },
      previewUrl: rawDataUrl,
    };
  }

  if (file.size > MAX_BYTES * 2) {
    throw new Error('Image is too large. Please upload a file under 8 MB.');
  }

  // Downscale larger phone photos/screenshots smoothly in browser canvas
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Invalid image file.'));
    el.src = rawDataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width || 1, img.height || 1));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const base64 = rawDataUrl.split(',')[1] || '';
    return {
      attachment: { mimeType, data: base64, name: file.name },
      previewUrl: rawDataUrl,
    };
  }

  ctx.drawImage(img, 0, 0, width, height);
  const outMime: 'image/jpeg' | 'image/png' | 'image/webp' =
    mimeType === 'image/png' && file.size < 1_500_000 ? 'image/png' : 'image/jpeg';
  const compressedUrl = canvas.toDataURL(outMime, 0.85);
  const compressedBase64 = compressedUrl.split(',')[1] || '';

  return {
    attachment: { mimeType: outMime, data: compressedBase64, name: file.name },
    previewUrl: compressedUrl,
  };
}

/** Avoid sending email-based legacy DiceBear seeds to a third-party image host. */
export function safeAvatarUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  try {
    const url = new URL(src, typeof window !== 'undefined' ? window.location.origin : 'https://learn-co.ai.studio');
    if (url.hostname.toLowerCase() === 'api.dicebear.com' && (url.searchParams.get('seed') || '').includes('@')) {
      return undefined;
    }
    return src;
  } catch {
    return undefined;
  }
}

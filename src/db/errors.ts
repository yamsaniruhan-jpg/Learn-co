// Drizzle errors can contain SQL query parameters (including personal data).
// Log only a bounded database/transport code, never the error or its cause.
export function logSqlFailure(operation: string, error: unknown): void {
  const candidate = (error as any)?.cause?.code ?? (error as any)?.code;
  const code = typeof candidate === 'string' && /^[A-Z0-9]{1,16}$/.test(candidate)
    ? ` (${candidate})`
    : '';
  console.error(`[CloudSQL] ${operation}${code}`);
}

/**
 * Copilot Response Cache & AI Token Economy Engine
 * Drastically reduces AI costs and API latency by caching common STEM concepts,
 * Socratic hints, and derivations while tracking token and cost savings.
 */

export interface CacheEntry {
  reply: string;
  modelUsed: string;
  mode: string;
  citations: any[];
  toolCalls: any[];
  artifact?: any;
  cachedAt: number;
  hits: number;
  estimatedTokensSaved: number;
}

export interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatePercent: number;
  totalTokensSaved: number;
  totalEstimatedSavingsDollars: number;
  cachedEntriesCount: number;
}

export class CopilotCacheEngine {
  private static cache: Map<string, CacheEntry> = new Map();
  private static readonly MAX_ENTRIES = 500;
  private static readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  private static totalRequests = 0;
  private static cacheHits = 0;
  private static totalTokensSaved = 0;

  /**
   * Generates a normalized cache key based on prompt, mode, and learner level
   */
  static generateKey(
    prompt: string,
    mode: string = 'socratic_hint',
    learnerLevel: string = 'intermediate',
    modelPreference?: string
  ): string {
    const normalizedPrompt = prompt
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\$\+\-\*\/\=\^\(\)]/g, '')
      .replace(/\s+/g, ' ');

    return `${mode}:${learnerLevel}:${modelPreference || 'auto'}:${normalizedPrompt}`;
  }

  /**
   * Retrieves a cached response if valid and not expired
   */
  static get(key: string): CacheEntry | null {
    this.totalRequests++;

    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.cachedAt > this.TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    this.cacheHits++;

    // Estimate savings: input tokens ~150 + output tokens ~350 = ~500 tokens saved
    const tokens = entry.estimatedTokensSaved || 500;
    this.totalTokensSaved += tokens;

    // Refresh LRU order: delete and re-insert
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  /**
   * Stores a generated response in the cache
   */
  static set(
    key: string,
    data: {
      reply: string;
      modelUsed: string;
      mode: string;
      citations: any[];
      toolCalls: any[];
      artifact?: any;
    }
  ): void {
    // Avoid caching very short or error replies
    if (!data.reply || data.reply.length < 20) return;

    // Enforce LRU eviction if cache reaches capacity
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const estimatedTokens = Math.ceil((data.reply.length + 200) / 4);

    this.cache.set(key, {
      ...data,
      cachedAt: Date.now(),
      hits: 0,
      estimatedTokensSaved: estimatedTokens,
    });
  }

  /**
   * Returns telemetry stats on token economy and cost savings
   */
  static getStats(): CacheStats {
    const hits = this.cacheHits;
    const total = this.totalRequests;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    // Gemini 3.1 Flash-Lite / 3.8 Flash blended rate ~$0.15 per 1M tokens
    const costSavings = (this.totalTokensSaved / 1_000_000) * 0.15;

    return {
      totalRequests: total,
      cacheHits: hits,
      cacheMisses: total - hits,
      hitRatePercent: parseFloat(hitRate.toFixed(1)),
      totalTokensSaved: this.totalTokensSaved,
      totalEstimatedSavingsDollars: parseFloat(costSavings.toFixed(4)),
      cachedEntriesCount: this.cache.size,
    };
  }

  /**
   * Clear cache
   */
  static clear(): void {
    this.cache.clear();
  }
}

import {
  ConceptDetail,
  ExamTrackId,
  SubjectCurriculum,
  SubjectId,
} from '../types/curriculum';
import { SUBJECT_SUMMARIES } from './curriculumMeta';

const subjectCache = new Map<string, SubjectCurriculum>();
const inFlightRequests = new Map<string, Promise<SubjectCurriculum | null>>();

function cacheKey(subjectId: SubjectId, trackId: ExamTrackId = 'all'): string {
  return `${trackId}:${subjectId}`;
}

export function getCachedSubjectCurriculum(
  subjectId: SubjectId,
  trackId: ExamTrackId = 'all'
): SubjectCurriculum | null {
  return subjectCache.get(cacheKey(subjectId, trackId)) || null;
}

/**
 * Loads one subject curriculum on demand via the backend API (keeping initial mobile
 * bundle size near-zero), falling back to a dynamically-imported offline chunk only
 * when network/API is unreachable.
 */
export async function loadSubjectCurriculum(
  subjectId: SubjectId,
  trackId: ExamTrackId = 'all'
): Promise<SubjectCurriculum | null> {
  const key = cacheKey(subjectId, trackId);
  const cached = subjectCache.get(key);
  if (cached) return cached;

  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) return existingPromise;

  const loaderPromise = (async (): Promise<SubjectCurriculum | null> => {
    try {
      const params = new URLSearchParams();
      params.set('subjectId', subjectId);
      if (trackId && trackId !== 'all') {
        params.set('trackId', trackId);
      }
      const res = await fetch(`/api/learning/curriculum?${params.toString()}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json().catch(() => null);
          if (Array.isArray(data?.subjects) && data.subjects.length > 0) {
            const subjectData = data.subjects[0] as SubjectCurriculum;
            subjectCache.set(key, subjectData);
            return subjectData;
          }
        }
      }
    } catch {
      // Fall back to dynamically-loaded offline dataset below
    }

    // Dynamic import splits curriculumData out of initial mobile JS bundles.
    const mod = await import('./curriculumData');
    let found = mod.CURRICULUM_DATA.find((s) => s.id === subjectId) || null;
    if (found && trackId && trackId !== 'all') {
      found = {
        ...found,
        chapters: found.chapters.filter(
          (ch) => ch.examTracks.includes(trackId) || ch.examTracks.includes('all')
        ),
      };
    }
    if (found) {
      subjectCache.set(key, found);
    }
    return found;
  })();

  inFlightRequests.set(key, loaderPromise);
  try {
    return await loaderPromise;
  } finally {
    inFlightRequests.delete(key);
  }
}

export async function loadCurriculumOfflineFallback(
  trackId?: ExamTrackId,
  subjectId?: SubjectId
): Promise<SubjectCurriculum[]> {
  if (subjectId && (subjectId as string) !== 'all') {
    const one = await loadSubjectCurriculum(subjectId, trackId || 'all');
    return one ? [one] : [];
  }
  const results = await Promise.all(
    SUBJECT_SUMMARIES.map((s) => loadSubjectCurriculum(s.id, trackId || 'all'))
  );
  return results.filter((s): s is SubjectCurriculum => Boolean(s));
}

export async function findConceptOfflineFallback(conceptId: string): Promise<ConceptDetail | null> {
  // Check already-loaded per-subject cache first before touching full fallback chunk
  for (const subject of subjectCache.values()) {
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        for (const subtopic of topic.subtopics) {
          const hit = subtopic.concepts.find((c) => c.id === conceptId);
          if (hit) return hit;
        }
      }
    }
  }

  const mod = await import('./curriculumData');
  for (const subject of mod.CURRICULUM_DATA) {
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        for (const subtopic of topic.subtopics) {
          const hit = subtopic.concepts.find((c) => c.id === conceptId);
          if (hit) return hit;
        }
      }
    }
  }
  return null;
}

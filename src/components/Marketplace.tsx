import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../client/firebase';
import { useAuth } from '../context/AuthContext';
import { AuthClient } from '../services/authClient';
import { FormattedMathText } from './common/FormattedMathText';
import { recordDailyActivity } from '../utils/streakManager';
import {
  MarketplaceCourseProgress,
  fetchCourseProgressFromFirestore,
  syncCourseProgressToFirestore,
  syncPublishedCourseToFirestore,
  fetchPublishedCoursesFromFirestore,
} from '../services/marketplaceFirestore';
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Sparkles,
  X,
  AlertCircle,
  MessageSquare,
  ListChecks,
  Play,
  Plus,
  Award,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
} from 'lucide-react';

const SUBJECTS = [
  { value: 'math', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'cs', label: 'Computer Science' },
  { value: 'biology', label: 'Biology' },
  { value: 'programming', label: 'Programming' },
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

interface LessonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface CourseLesson {
  id: string;
  moduleIndex: number;
  moduleTitle: string;
  title: string;
  durationMinutes: number;
  summary: string;
  contentMarkdown: string;
  keyFormulas?: string[];
  quiz?: LessonQuiz;
}

export default function Marketplace() {
  const { isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [catalogSource, setCatalogSource] = useState<string | null>(null);
  const searchRequest = useRef(0);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState('newest');
  const [onlyEnrolled, setOnlyEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [activePlayerCourse, setActivePlayerCourse] = useState<any | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [loadingCoursePlayer, setLoadingCoursePlayer] = useState(false);
  const [selectedQuizChoice, setSelectedQuizChoice] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);

  const [enrolling, setEnrolling] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<Record<string, boolean>>({});
  const [progressByCourse, setProgressByCourse] = useState<Record<string, MarketplaceCourseProgress>>({});
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Course reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Publish course modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingCourse, setPublishingCourse] = useState(false);
  const [pubTitle, setPubTitle] = useState('');
  const [pubSubject, setPubSubject] = useState('math');
  const [pubDifficulty, setPubDifficulty] = useState('intermediate');
  const [pubDescription, setPubDescription] = useState('');
  const [pubLessonTitle, setPubLessonTitle] = useState('');
  const [pubLessonContent, setPubLessonContent] = useState('');
  const [pubFormula, setPubFormula] = useState('');
  const [pubQuizQuestion, setPubQuizQuestion] = useState('');
  const [pubQuizCorrect, setPubQuizCorrect] = useState('');
  const [pubQuizDistractor, setPubQuizDistractor] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const search = async () => {
    const requestId = ++searchRequest.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ query, subject, difficulty, sort });
      const res = await apiCall(`/marketplace/search?${params}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response.');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Marketplace request failed (${res.status})`);
      if (requestId === searchRequest.current) {
        let combined: any[] = data.courses || [];
        try {
          const fsCourses = await fetchPublishedCoursesFromFirestore();
          if (fsCourses.length > 0) {
            const byId = new Map<string, any>();
            for (const c of combined) byId.set(c.id, c);
            for (const fc of fsCourses) {
              const prev = byId.get(fc.id);
              byId.set(fc.id, prev ? { ...fc, ...prev } : fc);
            }
            combined = Array.from(byId.values());
          }
        } catch {
          // Ignore optional Firestore merge failure
        }
        setCourses(combined);
        setCatalogSource(data.catalogSource || null);
      }
    } catch (error: any) {
      if (requestId === searchRequest.current) {
        console.error('Search error:', error);
        showToast(error?.message || 'Could not load marketplace courses.', 'error');
      }
    } finally {
      if (requestId === searchRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    search();
    return () => {
      searchRequest.current++;
    };
  }, [subject, difficulty, sort]);

  useEffect(() => {
    if (!isAuthenticated) {
      setEnrolledCourses({});
      setProgressByCourse({});
      return;
    }
    (async () => {
      try {
        const [enrollRes, progRes, fsProgress] = await Promise.all([
          apiCall('/marketplace/enrollments'),
          apiCall('/marketplace/progress'),
          fetchCourseProgressFromFirestore(),
        ]);

        if (enrollRes.ok && (enrollRes.headers.get('content-type') || '').includes('application/json')) {
          const data = await enrollRes.json();
          const map: Record<string, boolean> = {};
          (data.enrolledCourseIds || []).forEach((id: string) => {
            map[id] = true;
          });
          setEnrolledCourses(map);
        }

        const mergedProgress: Record<string, MarketplaceCourseProgress> = { ...fsProgress };
        if (progRes.ok && (progRes.headers.get('content-type') || '').includes('application/json')) {
          const pData = await progRes.json();
          Object.entries(pData.progressByCourse || {}).forEach(([cid, val]) => {
            const serverProg = val as MarketplaceCourseProgress;
            const existing = mergedProgress[cid];
            if (!existing || serverProg.completedLessonIds.length >= existing.completedLessonIds.length) {
              mergedProgress[cid] = serverProg;
            }
          });
        }
        setProgressByCourse(mergedProgress);
      } catch {
        // Ignore silent background sync error
      }
    })();
  }, [isAuthenticated]);

  const openCourseModal = async (course: any) => {
    setSelectedCourse(course);
    setReviews([]);
    setLoadingReviews(true);
    try {
      const [revRes, detailsRes] = await Promise.all([
        apiCall(`/marketplace/reviews/${course.id}`),
        apiCall(`/marketplace/course/${course.id}`),
      ]);
      if (revRes.ok && (revRes.headers.get('content-type') || '').includes('application/json')) {
        const data = await revRes.json();
        setReviews(data.reviews || []);
      }
      if (detailsRes.ok && (detailsRes.headers.get('content-type') || '').includes('application/json')) {
        const dData = await detailsRes.json();
        if (dData.course) {
          setSelectedCourse(dData.course);
        }
        if (dData.progress) {
          setProgressByCourse((prev) => ({ ...prev, [course.id]: dData.progress }));
        }
      }
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const launchCoursePlayer = async (course: any, startLessonIndex?: number) => {
    if (!isAuthenticated) {
      showToast('Please sign in first to launch interactive course lessons and track mastery.', 'error');
      return;
    }
    setLoadingCoursePlayer(true);
    try {
      // Ensure enrollment if not yet enrolled
      if (!enrolledCourses[course.id]) {
        const eRes = await apiCall(`/marketplace/enroll/${course.id}`, { method: 'POST' });
        if (!eRes.ok) {
          const failed = await eRes.json().catch(() => ({}));
          showToast(failed.error || 'Could not enroll in this course.', 'error');
          return;
        }
        setEnrolledCourses((prev) => ({ ...prev, [course.id]: true }));
      }

      const res = await apiCall(`/marketplace/course/${course.id}`);
      const data = res.ok ? await res.json() : { course };
      const fullCourse = data.course || course;
      const prog: MarketplaceCourseProgress | undefined = data.progress || progressByCourse[course.id];
      if (data.progress) {
        setProgressByCourse((prev) => ({ ...prev, [course.id]: data.progress }));
      }

      const lessons: CourseLesson[] = Array.isArray(fullCourse.lessons) ? fullCourse.lessons : [];
      const firstIncomplete =
        typeof startLessonIndex === 'number'
          ? startLessonIndex
          : Math.max(
              0,
              lessons.findIndex((l) => !prog?.completedLessonIds?.includes(l.id))
            );

      setSelectedCourse(null);
      setActivePlayerCourse(fullCourse);
      setActiveLessonIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
      setSelectedQuizChoice(null);
      setQuizFeedback(null);
    } catch {
      showToast('Could not open course classroom.', 'error');
    } finally {
      setLoadingCoursePlayer(false);
    }
  };

  const handleEnroll = async (courseId: string, openImmediately = false) => {
    if (!isAuthenticated) {
      showToast('Please sign in first to enroll in marketplace courses.', 'error');
      return;
    }
    setEnrolling(true);
    try {
      const res = await apiCall(`/marketplace/enroll/${courseId}`, { method: 'POST' });
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : {};
      if (res.ok && (data.success || data.alreadyEnrolled)) {
        setEnrolledCourses((prev) => ({ ...prev, [courseId]: true }));
        if (!data.alreadyEnrolled) {
          setCourses((prev) =>
            prev.map((c) => (c.id === courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c))
          );
          setSelectedCourse((prev: any) =>
            prev && prev.id === courseId ? { ...prev, enrolledCount: (prev.enrolledCount || 0) + 1 } : prev
          );
        }
        showToast(data.persistence === 'memory'
          ? 'Enrollment is stored only for this server session and may disappear after restart.'
          : data.alreadyEnrolled ? 'Course ready! Launching workspace.' : 'Enrolled! Opening course classroom.');
        if (openImmediately) {
          const target = courses.find((c) => c.id === courseId) || selectedCourse;
          if (target) await launchCoursePlayer(target, 0);
        }
      } else {
        showToast(data.error || 'Failed to enroll in course.', 'error');
      }
    } catch {
      showToast('Network error while enrolling. Please try again.', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const handleSaveLessonAction = async (lessonId: string, completed = true, quizChoiceIndex: number | null = null) => {
    if (!activePlayerCourse) return;
    const token = AuthClient.getToken();
    const accountId = user?.id;
    setSavingProgress(true);
    try {
      const res = await apiCall(`/marketplace/progress/${activePlayerCourse.id}`, {
        method: 'POST',
        body: JSON.stringify({ lessonId, completed, quizChoiceIndex }),
      });
      const data = res.ok ? await res.json() : null;
      if (res.ok && data?.progress) {
        setProgressByCourse((prev) => ({ ...prev, [activePlayerCourse.id]: data.progress }));
        if (token && token === AuthClient.getToken() && accountId === AuthClient.getCurrentUser()?.id) {
          void syncCourseProgressToFirestore(activePlayerCourse.id, data.progress);
        }
        if (data.quizEvaluation) {
          setQuizFeedback({
            correct: Boolean(data.quizEvaluation.correct),
            explanation: String(data.quizEvaluation.explanation || ''),
          });
          if (data.quizEvaluation.correct) {
            recordDailyActivity(user?.id || 'default_user', {
              questionsSolved: 1,
              xpEarned: 20,
              minutesStudied: 10,
              sessionsCompleted: 1,
            });
            showToast('Concept verified! Lesson marked complete (+20 XP).');
          }
        } else if (completed) {
          recordDailyActivity(user?.id || 'default_user', {
            questionsSolved: 1,
            xpEarned: 15,
            minutesStudied: 10,
            sessionsCompleted: 1,
          });
          showToast('Lesson completed (+15 XP).');
        }
        if (data.persistence === 'memory') {
          showToast('Progress is stored only for this server session and may disappear after restart.');
        }
      } else {
        showToast(data?.error || 'Could not save lesson progress.', 'error');
      }
    } catch {
      showToast('Network error saving progress.', 'error');
    } finally {
      setSavingProgress(false);
    }
  };

  const handlePublishCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to publish a course.', 'error');
      return;
    }
    if (!pubTitle.trim() || !pubDescription.trim()) {
      showToast('Please enter a course title and description.', 'error');
      return;
    }
    setPublishingCourse(true);
    const courseId = `course-${Date.now().toString(36)}`;
    const lessonTitle = pubLessonTitle.trim() || 'Core Intuition & Foundations';
    const lessonBody =
      pubLessonContent.trim() ||
      `${pubDescription.trim()} Begin with exact definitions, units, and boundary conditions before solving practice problems.`;

    const payload = {
      title: pubTitle.trim(),
      description: pubDescription.trim(),
      subject: pubSubject,
      difficulty: pubDifficulty,
      creatorName: user?.fullName || user?.email?.split('@')[0] || 'Scholar Educator',
      tags: [pubSubject.toUpperCase(), pubDifficulty],
      modules: [lessonTitle, 'Applied Synthesis & Verification'],
      lessons: [
        {
          id: `${courseId}-l1`,
          moduleIndex: 0,
          moduleTitle: lessonTitle,
          title: lessonTitle,
          durationMinutes: 20,
          summary: pubDescription.trim().slice(0, 140),
          contentMarkdown: lessonBody,
          keyFormulas: pubFormula.trim() ? [pubFormula.trim()] : [],
          quiz: {
            question: pubQuizQuestion.trim() || `Which practice anchors mastery of ${lessonTitle}?`,
            options: [
              pubQuizCorrect.trim() || 'Verifying definitions, units, and boundary behavior systematically',
              pubQuizDistractor.trim() || 'Memorizing final numbers without checking assumptions',
            ],
            correctIndex: 0,
            explanation: 'Checking governing definitions and edge-case assumptions ensures transferable understanding.',
          },
        },
        {
          id: `${courseId}-l2`,
          moduleIndex: 1,
          moduleTitle: 'Applied Synthesis & Verification',
          title: 'Worked Problem Strategy & Edge Cases',
          durationMinutes: 25,
          summary: `Applying ${pubTitle.trim()} to multi-step diagnostic scenarios.`,
          contentMarkdown: `Work through multi-step scenarios in ${pubTitle.trim()} by isolating known invariants first, substituting parameters symbolically, and checking limiting cases.`,
          keyFormulas: pubFormula.trim() ? [pubFormula.trim()] : [],
          quiz: {
            question: 'When testing a derived result against physical or mathematical limits, what confirms robustness?',
            options: [
              'Limiting cases recover known special-case answers and dimensions match',
              'Ignoring boundary conditions speeds up guessing',
            ],
            correctIndex: 0,
            explanation: 'Dimensional and limiting-case consistency checks catch algebra and conceptual errors immediately.',
          },
        },
      ],
      price: 0,
    };

    try {
      const res = await apiCall(`/marketplace/publish/${courseId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      const publishedToClientFirestore = res.ok && data.success
        ? await syncPublishedCourseToFirestore(data.course || { id: courseId, ...payload })
        : res.status === 503
        ? await syncPublishedCourseToFirestore({
            id: courseId,
            ...payload,
            creatorName: user?.name || user?.email?.split('@')[0] || 'Scholar Educator',
            totalLessons: payload.lessons.length,
            totalModules: payload.modules.length,
            estimatedHours: Math.max(2, payload.lessons.length * 2),
            rating: 0,
            ratingCount: 0,
            enrolledCount: 0,
            publishedAt: new Date().toISOString(),
          })
        : false;

      if ((res.ok && data.success) || publishedToClientFirestore) {
        setShowPublishModal(false);
        setPubTitle('');
        setPubDescription('');
        setPubLessonTitle('');
        setPubLessonContent('');
        setPubFormula('');
        setPubQuizQuestion('');
        setPubQuizCorrect('');
        setPubQuizDistractor('');
        showToast('Course published live to the Marketplace!');
        await search();
      } else {
        showToast(data.error || 'Could not publish course.', 'error');
      }
    } catch {
      showToast('Network error while publishing course.', 'error');
    } finally {
      setPublishingCourse(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!isAuthenticated) {
      showToast('Please sign in to post a course review.', 'error');
      return;
    }
    if (!reviewComment.trim()) {
      showToast('Please write a short comment for your review.', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await apiCall(`/marketplace/review/${selectedCourse.id}`, {
        method: 'POST',
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
      });
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : {};
      if (res.ok && data.success) {
        setReviewComment('');
        showToast(data.review?.persistence === 'memory'
          ? 'Review is stored only for this server session and may disappear after restart.'
          : 'Review submitted!');
        const revRes = await apiCall(`/marketplace/reviews/${selectedCourse.id}`);
        if (revRes.ok && (revRes.headers.get('content-type') || '').includes('application/json')) {
          const revData = await revRes.json();
          setReviews(revData.reviews || []);
        }
        search();
      } else {
        showToast(data.error || 'Could not submit review.', 'error');
      }
    } catch {
      showToast('Network error while submitting review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const displayedCourses = onlyEnrolled ? courses.filter((c) => !!enrolledCourses[c.id]) : courses;

  const activeLessons: CourseLesson[] = activePlayerCourse?.lessons || [];
  const currentLesson = activeLessons[activeLessonIndex] || null;
  const activeProgress = activePlayerCourse ? progressByCourse[activePlayerCourse.id] : undefined;
  const completedIds = new Set(activeProgress?.completedLessonIds || []);
  const courseCompletionPct =
    activeLessons.length > 0 ? Math.min(100, Math.round((completedIds.size / activeLessons.length) * 100)) : 0;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {toast && (
        <div
          role="status"
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-white shadow-xl text-sm font-bold animate-in slide-in-from-top ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[#6C5CE7]" />
            Course Marketplace
          </h1>
          <p className="text-sm sm:text-base text-[#6B6890] dark:text-[#B4B0D5] mt-1">
            Interactive STEM masterclasses with structured lessons, formula breakdowns, and live concept checks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
          <span className="px-3 py-2 rounded-xl bg-[#F0EDFA] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5] tabular-nums">
            {courses.length} Course{courses.length === 1 ? '' : 's'}{catalogSource === 'sample' ? ' (sample)' : ''}
          </span>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Publish Course
            </button>
          )}
        </div>
      </div>

      {catalogSource === 'sample' && (
        <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Showing sample courses while the live catalog is unavailable. Names, ratings and enrollment counts are illustrative.
        </div>
      )}

      {/* Search Bar & Filters */}
      <div className="bg-white dark:bg-[#2A2647] p-4 sm:p-6 rounded-3xl border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#8E8BAF]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Search courses by title, topic, instructor, or skill..."
              className="w-full pl-12 pr-4 border border-[#E3DFF5] dark:border-[#3D3861] rounded-2xl py-3 focus:ring-2 focus:ring-[#6C5CE7] focus:outline-none bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] placeholder:text-[#8E8BAF] text-sm font-medium"
            />
          </div>
          <button
            type="button"
            onClick={search}
            className="min-h-[44px] bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white px-6 py-3 rounded-2xl transition-colors font-bold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E3DFF5] dark:border-[#3D3861]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="min-h-[40px] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 text-xs font-semibold bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer"
          >
            <option value="">All Subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="min-h-[40px] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 text-xs font-semibold bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer"
          >
            <option value="">All Levels</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setOnlyEnrolled((v) => !v)}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                onlyEnrolled
                  ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white'
                  : 'bg-[#F7F5FF] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5]'
              }`}
            >
              My Enrolled ({Object.values(enrolledCourses).filter(Boolean).length})
            </button>
          )}
          {(query || subject || difficulty || onlyEnrolled) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSubject('');
                setDifficulty('');
                setOnlyEnrolled(false);
              }}
              className="text-xs font-bold text-[#6C5CE7] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="min-h-[40px] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 text-xs font-semibold bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer ml-auto"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-3xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-5 flex flex-col justify-between">
              <div className="h-36 rounded-2xl bg-[#F0EDFA] dark:bg-[#1E1B33]" />
              <div className="space-y-2">
                <div className="h-4 w-2/3 rounded bg-[#F0EDFA] dark:bg-[#1E1B33]" />
                <div className="h-3 w-full rounded bg-[#F7F5FF] dark:bg-[#1E1B33]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCourses.map((course) => (
            <CourseCard
              key={course.id || course.title}
              course={course}
              isEnrolled={!!enrolledCourses[course.id]}
              progress={progressByCourse[course.id]}
              onSelect={() => openCourseModal(course)}
              onLaunch={(e) => {
                e.stopPropagation();
                void launchCoursePlayer(course);
              }}
            />
          ))}
          {displayedCourses.length === 0 && (
            <div className="col-span-full text-center py-20 rounded-3xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-8 space-y-2">
              <p className="text-base font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                {onlyEnrolled ? 'You have not enrolled in any courses yet' : 'No courses found'}
              </p>
              <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                {onlyEnrolled
                  ? 'Clear "My Enrolled" to browse and launch free interactive STEM masterclasses.'
                  : 'Try adjusting your search query or subject filters.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#2A2647] p-6 sm:p-8 shadow-2xl border border-[#E3DFF5] dark:border-[#3D3861] space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED] px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedCourse.subject || 'General'}
                  </span>
                  <span className="text-xs font-semibold text-[#6B6890] dark:text-[#B4B0D5] capitalize">
                    {selectedCourse.difficulty || 'Beginner'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                  {selectedCourse.title}
                </h2>
                <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1">
                  Created by <strong className="text-[#2D2A4A] dark:text-white">{selectedCourse.creatorName || 'Expert Faculty'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="p-2 rounded-xl text-[#6B6890] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
                aria-label="Close course overview"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedCourse.thumbnailUrl && (
              <div className="h-44 w-full rounded-2xl overflow-hidden border border-[#E3DFF5] dark:border-[#3D3861]">
                <img src={selectedCourse.thumbnailUrl} alt={selectedCourse.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider">About Course</h4>
              <p className="text-sm text-[#2D2A4A] dark:text-[#F1EFFF] leading-relaxed">
                {selectedCourse.description}
              </p>
            </div>

            {selectedCourse.lessons && selectedCourse.lessons.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-[#6C5CE7]" />
                  <span>Interactive Lessons ({selectedCourse.lessons.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCourse.lessons.map((lesson: CourseLesson, idx: number) => {
                    const done = progressByCourse[selectedCourse.id]?.completedLessonIds?.includes(lesson.id);
                    return (
                      <div
                        key={lesson.id || idx}
                        className="p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                              done ? 'bg-emerald-600 text-white' : 'bg-[#6C5CE7] text-white'
                            }`}
                          >
                            {done ? '✓' : idx + 1}
                          </span>
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <span className="text-[10px] text-[#6B6890] dark:text-[#B4B0D5] shrink-0 tabular-nums">
                          {lesson.durationMinutes || 25}m
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#E3DFF5] dark:border-[#3D3861] text-center tabular-nums">
              <div>
                <p className="text-[10px] uppercase font-black text-[#6B6890] dark:text-[#B4B0D5]">Lessons</p>
                <p className="text-lg font-black text-[#2D2A4A] dark:text-[#F1EFFF] mt-0.5">
                  {selectedCourse.lessons?.length || selectedCourse.totalLessons || 4}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-[#6B6890] dark:text-[#B4B0D5]">Est. Effort</p>
                <p className="text-lg font-black text-[#2D2A4A] dark:text-[#F1EFFF] mt-0.5">{selectedCourse.estimatedHours || 10} hrs</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-[#6B6890] dark:text-[#B4B0D5]">Enrolled</p>
                <p className="text-lg font-black text-[#2D2A4A] dark:text-[#F1EFFF] mt-0.5">{selectedCourse.enrolledCount ?? 0}</p>
              </div>
            </div>

            {/* Course Reviews */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#00B8A9]" />
                <span>Scholar Reviews ({reviews.length})</span>
              </h4>

              {loadingReviews ? (
                <p className="text-xs text-[#6B6890]">Loading reviews...</p>
              ) : reviews.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">{rev.userName || 'Scholar'}</span>
                        <span className="text-amber-500 font-bold">{'★'.repeat(rev.rating || 5)}</span>
                      </div>
                      <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">No reviews yet. Be the first scholar to review this course.</p>
              )}

              {isAuthenticated && (
                <form onSubmit={handleSubmitReview} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-2.5 py-2 text-xs font-bold bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ★
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your review of this course..."
                    className="flex-1 border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 rounded-xl bg-[#00B8A9] hover:bg-[#009e91] text-white font-bold text-xs cursor-pointer disabled:opacity-60"
                  >
                    {submittingReview ? 'Posting...' : 'Post Review'}
                  </button>
                </form>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div>
                <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5] block">Price</span>
                <span className="text-2xl font-black text-[#6C5CE7] dark:text-[#8577ED]">
                  {!selectedCourse.price || selectedCourse.price === 0 ? 'Free' : `$${selectedCourse.price}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="min-h-[44px] px-5 py-2.5 rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] font-bold text-sm hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition cursor-pointer"
                >
                  Close
                </button>
                {enrolledCourses[selectedCourse.id] ? (
                  <button
                    type="button"
                    disabled={loadingCoursePlayer}
                    onClick={() => void launchCoursePlayer(selectedCourse)}
                    className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    {loadingCoursePlayer ? 'Opening...' : 'Continue Course'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={enrolling}
                    onClick={() => void handleEnroll(selectedCourse.id, true)}
                    className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    {enrolling ? 'Enrolling...' : 'Enroll & Start Learning'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Course Classroom / Player Modal */}
      {activePlayerCourse && currentLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-5xl h-[92vh] rounded-3xl bg-white dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] shadow-2xl flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="px-4 sm:px-6 py-4 border-b border-[#E3DFF5] dark:border-[#3D3861] bg-[#F7F5FF] dark:bg-[#2A2647] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#6C5CE7] dark:text-[#8577ED]">
                  {activePlayerCourse.subject} • Course Classroom
                </p>
                <h2 className="text-base sm:text-lg font-black text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                  {activePlayerCourse.title}
                </h2>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:block text-right">
                  <p className="text-[11px] font-bold text-[#6B6890] dark:text-[#B4B0D5] tabular-nums">
                    {completedIds.size}/{activeLessons.length} Lessons ({courseCompletionPct}%)
                  </p>
                  <div className="w-36 h-2 rounded-full bg-[#E3DFF5] dark:bg-[#1E1B33] overflow-hidden mt-1">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${courseCompletionPct}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePlayerCourse(null)}
                  className="p-2 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-white dark:hover:bg-[#1E1B33] cursor-pointer"
                  aria-label="Exit course classroom"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body: Sidebar + Lesson Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Curriculum Sidebar */}
              <aside className="md:w-72 border-b md:border-b-0 md:border-r border-[#E3DFF5] dark:border-[#3D3861] bg-[#FAF9FF] dark:bg-[#24203E] p-3 sm:p-4 overflow-y-auto space-y-2 max-h-44 md:max-h-none">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#6B6890] dark:text-[#B4B0D5] px-1">
                  Curriculum
                </p>
                {activeLessons.map((lesson, idx) => {
                  const isDone = completedIds.has(lesson.id);
                  const isCurrent = idx === activeLessonIndex;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        setActiveLessonIndex(idx);
                        setSelectedQuizChoice(null);
                        setQuizFeedback(null);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition cursor-pointer flex items-start gap-2.5 ${
                        isCurrent
                          ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white shadow-sm'
                          : 'bg-white dark:bg-[#2A2647] border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] hover:border-[#6C5CE7]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-white text-[#6C5CE7]'
                            : 'bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7]'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-white/80' : 'text-[#6B6890] dark:text-[#B4B0D5]'}`}>
                          {lesson.moduleTitle}
                        </p>
                        <p className="text-xs font-bold leading-snug">{lesson.title}</p>
                      </div>
                    </button>
                  );
                })}
              </aside>

              {/* Main Lesson Area */}
              <main className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5]">
                    <span className="px-2.5 py-1 rounded-lg bg-[#F0EDFA] dark:bg-[#2A2647] text-[#6C5CE7] dark:text-[#8577ED]">
                      Module {currentLesson.moduleIndex + 1}: {currentLesson.moduleTitle}
                    </span>
                    <span className="tabular-nums flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {currentLesson.durationMinutes} min
                    </span>
                    {completedIds.has(currentLesson.id) && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                    {currentLesson.title}
                  </h3>
                  <div className="text-sm font-medium text-[#6B6890] dark:text-[#B4B0D5]">
                    <FormattedMathText text={currentLesson.summary} />
                  </div>
                </div>

                {/* Deep Explanation */}
                <div className="p-5 rounded-2xl bg-[#F7F5FF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#6C5CE7] dark:text-[#8577ED]">
                    First-Principles Lesson Notes
                  </h4>
                  <div className="text-sm sm:text-base leading-relaxed text-[#2D2A4A] dark:text-[#F1EFFF]">
                    <FormattedMathText text={currentLesson.contentMarkdown} />
                  </div>
                </div>

                {/* Key Formulas */}
                {currentLesson.keyFormulas && currentLesson.keyFormulas.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#6B6890] dark:text-[#B4B0D5]">
                      Key Formulas & Invariants
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentLesson.keyFormulas.map((formula, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-sm font-semibold text-[#2D2A4A] dark:text-[#F1EFFF]"
                        >
                          <FormattedMathText text={formula} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Concept Check */}
                {currentLesson.quiz && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#2A2647] border-2 border-[#6C5CE7]/25 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#6C5CE7] dark:text-[#8577ED]">
                      <HelpCircle className="w-4 h-4" />
                      <span>Interactive Mastery Check</span>
                    </div>
                    <div className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                      <FormattedMathText text={currentLesson.quiz.question} />
                    </div>
                    <div className="space-y-2">
                      {currentLesson.quiz.options.map((opt, idx) => {
                        const prevSaved = activeProgress?.quizResults?.[currentLesson.id];
                        const chosen = selectedQuizChoice !== null ? selectedQuizChoice : prevSaved?.selectedIndex ?? null;
                        const isSelected = chosen === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedQuizChoice(idx);
                              setQuizFeedback(null);
                            }}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? 'bg-[#6C5CE7]/10 border-[#6C5CE7] text-[#2D2A4A] dark:text-[#F1EFFF]'
                                : 'bg-[#FAF9FF] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] hover:border-[#6C5CE7]'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#6C5CE7] text-white' : 'bg-[#E3DFF5] dark:bg-[#2A2647] text-[#6B6890]'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="flex-1">
                              <FormattedMathText text={opt} inline />
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={savingProgress || selectedQuizChoice === null}
                        onClick={() => void handleSaveLessonAction(currentLesson.id, true, selectedQuizChoice)}
                        className="min-h-[44px] px-5 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition"
                      >
                        {savingProgress ? 'Checking...' : 'Check Answer & Verify Mastery'}
                      </button>
                      {!completedIds.has(currentLesson.id) && (
                        <button
                          type="button"
                          disabled={savingProgress}
                          onClick={() => void handleSaveLessonAction(currentLesson.id, true, null)}
                          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>

                    {quizFeedback && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                          quizFeedback.correct
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                        }`}
                      >
                        <p className="font-black mb-1">{quizFeedback.correct ? 'Correct!' : 'Not quite — review and retry:'}</p>
                        <FormattedMathText text={quizFeedback.explanation} />
                      </div>
                    )}
                  </div>
                )}

                {courseCompletionPct === 100 && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 flex items-center gap-3 text-emerald-900 dark:text-emerald-200">
                    <Award className="w-6 h-6 shrink-0 text-emerald-600" />
                    <div className="text-xs">
                      <p className="font-black">Course Mastered (100% Complete)</p>
                      <p>All lessons and checks in {activePlayerCourse.title} are saved to your scholar record.</p>
                    </div>
                  </div>
                )}

                {/* Lesson Footer Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-[#E3DFF5] dark:border-[#3D3861]">
                  <button
                    type="button"
                    disabled={activeLessonIndex === 0}
                    onClick={() => {
                      setActiveLessonIndex((i) => Math.max(0, i - 1));
                      setSelectedQuizChoice(null);
                      setQuizFeedback(null);
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Lesson
                  </button>
                  <button
                    type="button"
                    disabled={activeLessonIndex >= activeLessons.length - 1}
                    onClick={() => {
                      setActiveLessonIndex((i) => Math.min(activeLessons.length - 1, i + 1));
                      setSelectedQuizChoice(null);
                      setQuizFeedback(null);
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#00B8A9] hover:bg-[#009E91] text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  >
                    Next Lesson <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </main>
            </div>
          </div>
        </div>
      )}

      {/* Publish New Course Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <form
            onSubmit={handlePublishCourse}
            className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                Publish Live Marketplace Course
              </h2>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="p-2 rounded-xl text-[#6B6890] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1">Course Title *</label>
                <input
                  required
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  placeholder="e.g., Electromagnetism & Maxwell Equations"
                  className="w-full border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2.5 bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1">Subject</label>
                  <select
                    value={pubSubject}
                    onChange={(e) => setPubSubject(e.target.value)}
                    className="w-full border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2.5 bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1">Difficulty</label>
                  <select
                    value={pubDifficulty}
                    onChange={(e) => setPubDifficulty(e.target.value)}
                    className="w-full border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2.5 bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1">Course Description *</label>
                <textarea
                  required
                  rows={2}
                  value={pubDescription}
                  onChange={(e) => setPubDescription(e.target.value)}
                  placeholder="Describe the learning objectives and core intuitions..."
                  className="w-full border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1">Module 1 Lesson Title</label>
                <input
                  value={pubLessonTitle}
                  onChange={(e) => setPubLessonTitle(e.target.value)}
                  placeholder="e.g., Gauss Law & Flux Symmetry"
                  className="w-full border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2.5 bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1">Lesson Content (LaTeX $...$ supported)</label>
                <textarea
                  rows={3}
                  value={pubLessonContent}
                  onChange={(e) => setPubLessonContent(e.target.value)}
                  placeholder="Explain the core mechanism, equations, and edge cases..."
                  className="w-full border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1">Key Formula (optional)</label>
                <input
                  value={pubFormula}
                  onChange={(e) => setPubFormula(e.target.value)}
                  placeholder="e.g., $\\oint \\mathbf{E}\\cdot d\\mathbf{A} = Q_{enc} / \\varepsilon_0$"
                  className="w-full border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-2">
                <p className="font-black text-[#6C5CE7] dark:text-[#8577ED]">Concept Check Question (Optional)</p>
                <input
                  value={pubQuizQuestion}
                  onChange={(e) => setPubQuizQuestion(e.target.value)}
                  placeholder="Concept check question..."
                  className="w-full border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF]"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={pubQuizCorrect}
                    onChange={(e) => setPubQuizCorrect(e.target.value)}
                    placeholder="Correct answer option"
                    className="w-full border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF]"
                  />
                  <input
                    value={pubQuizDistractor}
                    onChange={(e) => setPubQuizDistractor(e.target.value)}
                    placeholder="Distractor option"
                    className="w-full border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={publishingCourse}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {publishingCourse ? 'Publishing...' : 'Publish Free Course'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  isEnrolled,
  progress,
  onSelect,
  onLaunch,
}: {
  course: any;
  isEnrolled: boolean;
  progress?: MarketplaceCourseProgress;
  onSelect: () => void;
  onLaunch: (e: React.MouseEvent) => void;
}) {
  const ratingVal = course.rating ?? 0;
  const roundedStars = Math.min(5, Math.max(0, Math.round(ratingVal)));
  const stars = '★'.repeat(roundedStars) + '☆'.repeat(5 - roundedStars);
  const lessonsCount = course.lessons?.length || course.totalLessons || 4;
  const pct =
    progress && lessonsCount > 0
      ? Math.min(100, Math.round(((progress.completedLessonIds?.length || 0) / lessonsCount) * 100))
      : 0;

  return (
    <div
      onClick={onSelect}
      className="bg-white dark:bg-[#2A2647] rounded-3xl border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm hover:shadow-xl hover:border-[#6C5CE7] transition-all overflow-hidden flex flex-col cursor-pointer group"
    >
      <div className="h-40 w-full relative overflow-hidden bg-gradient-to-br from-[#6C5CE7]/25 via-[#8577ED]/15 to-[#00B8A9]/20 flex items-center justify-center">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <BookOpen className="w-12 h-12 text-[#6C5CE7]" />
        )}
        {isEnrolled && (
          <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 tabular-nums">
            <CheckCircle className="w-3 h-3" /> {pct > 0 ? `${pct}% Done` : 'Enrolled'}
          </span>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {course.subject || 'General'}
            </span>
            <span className="text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] capitalize">
              {course.difficulty || 'Beginner'}
            </span>
          </div>
          <h3 className="font-black text-base text-[#2D2A4A] dark:text-[#F1EFFF] line-clamp-2 group-hover:text-[#6C5CE7] transition-colors">
            {course.title}
          </h3>
          <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>
        <div className="space-y-3 pt-3 border-t border-[#E3DFF5] dark:border-[#3D3861]">
          {isEnrolled && (
            <div className="w-full h-1.5 rounded-full bg-[#F0EDFA] dark:bg-[#1E1B33] overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
          <div className="flex items-center gap-2 text-xs tabular-nums">
            <span className="text-amber-500 font-bold">{stars}</span>
            <span className="text-[#6B6890] dark:text-[#B4B0D5]">({course.ratingCount || 42})</span>
            <span className="text-[#E3DFF5] dark:text-[#3D3861]">·</span>
            <span className="text-[#6B6890] dark:text-[#B4B0D5] flex items-center gap-1">
              <Users className="w-3 h-3" /> {course.enrolledCount ?? 0}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5] font-semibold flex items-center gap-1 tabular-nums">
              <Clock className="w-3.5 h-3.5" /> {lessonsCount} lessons · {course.estimatedHours || 10}h
            </span>
            {isEnrolled ? (
              <button
                type="button"
                onClick={onLaunch}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" /> Open
              </button>
            ) : (
              <span className="font-black text-base text-[#6C5CE7] dark:text-[#8577ED]">
                {!course.price || course.price === 0 ? 'Free' : `$${course.price}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

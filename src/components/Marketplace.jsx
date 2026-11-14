// src/components/Marketplace.jsx
import { useState, useEffect } from 'react';
import { apiCall } from '../client/firebase';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Star,
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

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState({});
  const [toast, setToast] = useState(null);

  // Course reviews state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const search = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ query, subject, difficulty, sort });
      const res = await apiCall(`/marketplace/search?${params}`);
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Search error:', error);
      showToast('Could not load marketplace courses.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
  }, [subject, difficulty, sort]);

  useEffect(() => {
    if (!isAuthenticated) {
      setEnrolledCourses({});
      return;
    }
    (async () => {
      try {
        const res = await apiCall('/marketplace/enrollments');
        if (res.ok) {
          const data = await res.json();
          const map = {};
          (data.enrolledCourseIds || []).forEach((id) => {
            map[id] = true;
          });
          setEnrolledCourses(map);
        }
      } catch {
        // Ignore silent fetch error
      }
    })();
  }, [isAuthenticated]);

  const openCourseModal = async (course) => {
    setSelectedCourse(course);
    setReviews([]);
    setLoadingReviews(true);
    try {
      const res = await apiCall(`/marketplace/reviews/${course.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleEnroll = async (courseId) => {
    if (!isAuthenticated) {
      showToast('Please sign in first to enroll in marketplace courses.', 'error');
      return;
    }
    setEnrolling(true);
    try {
      const res = await apiCall(`/marketplace/enroll/${courseId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && (data.success || data.alreadyEnrolled)) {
        setEnrolledCourses((prev) => ({ ...prev, [courseId]: true }));
        if (!data.alreadyEnrolled) {
          setCourses((prev) =>
            prev.map((c) => (c.id === courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c))
          );
          setSelectedCourse((prev) =>
            prev && prev.id === courseId ? { ...prev, enrolledCount: (prev.enrolledCount || 0) + 1 } : prev
          );
        }
        showToast(data.alreadyEnrolled ? 'You are already enrolled in this course.' : 'Successfully enrolled in course!');
      } else {
        showToast(data.error || 'Failed to enroll in course.', 'error');
      }
    } catch {
      showToast('Network error while enrolling. Please try again.', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const handleSubmitReview = async (e) => {
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
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewComment('');
        showToast('Review submitted!');
        const revRes = await apiCall(`/marketplace/reviews/${selectedCourse.id}`);
        if (revRes.ok) {
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
            Explore structured courses, calibrated problem tracks, and guided STEM masterclasses.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5]">
          <span className="px-3 py-1.5 rounded-xl bg-[#F0EDFA] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861]">
            {courses.length} Course{courses.length === 1 ? '' : 's'} Available
          </span>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-white dark:bg-[#2A2647] p-4 sm:p-6 rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#8E8BAF]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Search courses by title, topic, instructor, or skill..."
              className="w-full pl-12 pr-4 border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl py-3 focus:ring-2 focus:ring-[#6C5CE7] focus:outline-none bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] placeholder:text-[#8E8BAF] text-sm font-medium"
            />
          </div>
          <button
            type="button"
            onClick={search}
            className="bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white px-6 py-3 rounded-xl transition-colors font-bold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
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
            className="border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 text-xs font-semibold bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer"
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
            className="border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 text-xs font-semibold bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer"
          >
            <option value="">All Levels</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {(query || subject || difficulty) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSubject('');
                setDifficulty('');
              }}
              className="text-xs font-bold text-[#6C5CE7] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 text-xs font-semibold bg-white dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer ml-auto"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="text-center py-24 text-[#6B6890] dark:text-[#B4B0D5] text-sm font-semibold animate-pulse">
          Loading marketplace courses...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id || course.title}
              course={course}
              isEnrolled={!!enrolledCourses[course.id]}
              onSelect={() => openCourseModal(course)}
            />
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center py-20 rounded-2xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-8 space-y-2">
              <p className="text-base font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">No courses found</p>
              <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">Try adjusting your search query or subject filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
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
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedCourse.thumbnailUrl && (
              <div className="h-48 w-full rounded-2xl overflow-hidden border border-[#E3DFF5] dark:border-[#3D3861]">
                <img src={selectedCourse.thumbnailUrl} alt={selectedCourse.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider">About Course</h4>
              <p className="text-sm text-[#2D2A4A] dark:text-[#F1EFFF] leading-relaxed">
                {selectedCourse.description}
              </p>
            </div>

            {selectedCourse.modules && selectedCourse.modules.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-[#6C5CE7]" />
                  <span>Course Curriculum Modules</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCourse.modules.map((mod, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-md bg-[#6C5CE7] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCourse.tags && selectedCourse.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider">Skills Covered</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCourse.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED] font-bold border border-[#E3DFF5] dark:border-[#3D3861]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#E3DFF5] dark:border-[#3D3861] text-center">
              <div>
                <p className="text-[10px] uppercase font-black text-[#6B6890] dark:text-[#B4B0D5]">Lessons</p>
                <p className="text-lg font-black text-[#2D2A4A] dark:text-[#F1EFFF] mt-0.5">{selectedCourse.totalLessons || 12}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-[#6B6890] dark:text-[#B4B0D5]">Est. Effort</p>
                <p className="text-lg font-black text-[#2D2A4A] dark:text-[#F1EFFF] mt-0.5">{selectedCourse.estimatedHours || 10} hrs</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-[#6B6890] dark:text-[#B4B0D5]">Enrolled</p>
                <p className="text-lg font-black text-[#2D2A4A] dark:text-[#F1EFFF] mt-0.5">{selectedCourse.enrolledCount || 340}</p>
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

            <div className="flex items-center justify-between pt-2">
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
                  className="px-5 py-3 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] font-bold text-sm hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={enrolling || enrolledCourses[selectedCourse.id]}
                  onClick={() => handleEnroll(selectedCourse.id)}
                  className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2 ${
                    enrolledCourses[selectedCourse.id]
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white cursor-pointer'
                  }`}
                >
                  {enrolledCourses[selectedCourse.id] ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Enrolled
                    </>
                  ) : enrolling ? (
                    'Enrolling...'
                  ) : (
                    'Enroll Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, isEnrolled, onSelect }) {
  const ratingVal = course.rating || 4.8;
  const roundedStars = Math.min(5, Math.max(0, Math.round(ratingVal)));
  const stars = '★'.repeat(roundedStars) + '☆'.repeat(5 - roundedStars);

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
          <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Enrolled
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
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-500 font-bold">{stars}</span>
            <span className="text-[#6B6890] dark:text-[#B4B0D5]">({course.ratingCount || 42})</span>
            <span className="text-[#E3DFF5] dark:text-[#3D3861]">·</span>
            <span className="text-[#6B6890] dark:text-[#B4B0D5] flex items-center gap-1">
              <Users className="w-3 h-3" /> {course.enrolledCount || 340}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5] font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {course.totalLessons || 12} lessons · {course.estimatedHours || 10}h
            </span>
            <span className="font-black text-base text-[#6C5CE7] dark:text-[#8577ED]">
              {!course.price || course.price === 0 ? 'Free' : `$${course.price}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

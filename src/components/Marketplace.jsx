// src/components/Marketplace.jsx
import { useState, useEffect } from 'react';
import { apiCall } from '../client/firebase';

const SUBJECTS = ['Programming', 'Math', 'Science', 'Languages', 'Business', 'Design', 'Music'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export default function Marketplace() {
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ query, subject, difficulty, sort });
      const res = await apiCall(`/marketplace/search?${params}`);
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { search(); }, [subject, difficulty, sort]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
          Course Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6890] dark:text-[#B4B0D5] mt-1">
          Explore structured courses, calibrated problem tracks, and guided STEM modules.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search courses by title, topic, or skill..."
          className="flex-1 border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#6C5CE7] focus:outline-none bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF] placeholder:text-[#8E8BAF]"
        />
        <button
          onClick={search}
          className="bg-[#6C5CE7] text-white px-6 py-3 rounded-xl hover:bg-[#5B4BC4] transition-colors font-bold cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer"
        >
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer"
        >
          <option value="">All Levels</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Course Grid */}
      {loading ? (
        <p className="text-center text-[#6B6890] dark:text-[#B4B0D5] py-20 text-sm font-medium">Loading courses...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id || course.title} course={course} />
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center py-20 rounded-2xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-8">
              <p className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">No courses found</p>
              <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1">Try adjusting your search query or filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course }) {
  const ratingVal = course.rating || 5;
  const stars = '★'.repeat(Math.round(ratingVal)) + '☆'.repeat(Math.max(0, 5 - Math.round(ratingVal)));

  return (
    <div className="bg-white dark:bg-[#2A2647] rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="h-36 bg-gradient-to-br from-[#6C5CE7]/15 via-[#8577ED]/10 to-[#00B8A9]/15 dark:from-[#6C5CE7]/30 dark:to-[#1E1B33] flex items-center justify-center text-4xl">
        📖
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#8577ED] px-2.5 py-0.5 rounded-full">
              {course.subject || 'General'}
            </span>
            <span className="text-xs font-semibold text-[#6B6890] dark:text-[#B4B0D5] capitalize">
              {course.difficulty || 'Beginner'}
            </span>
          </div>
          <h3 className="font-bold text-base text-[#2D2A4A] dark:text-[#F1EFFF] mb-1 line-clamp-2">{course.title}</h3>
          <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mb-3 line-clamp-2">{course.description}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm mb-3">
            <span className="text-amber-500">{stars}</span>
            <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">({course.ratingCount || 0})</span>
            <span className="text-[#E3DFF5] dark:text-[#3D3861]">·</span>
            <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">{course.enrolledCount || 0} enrolled</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-[#E3DFF5] dark:border-[#3D3861]">
            <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5] font-medium">
              {course.totalLessons || 0} lessons · {course.estimatedHours || 1}h
            </span>
            <span className="font-black text-sm text-[#6C5CE7] dark:text-[#8577ED]">
              {!course.price || course.price === 0 ? 'Free' : `$${course.price}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">📚 Course Marketplace</h1>

      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search courses..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
        />
        <button onClick={search} className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold">
          Search
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800">
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800">
          <option value="">All Levels</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800">
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Course Grid */}
      {loading ? (
        <p className="text-center text-gray-400 py-20">Loading courses...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id || course.title} course={course} />
          ))}
          {courses.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-20">No courses found. Try different filters.</p>
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-4xl">
        📖
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{course.subject || 'General'}</span>
            <span className="text-xs font-medium text-gray-400 capitalize">{course.difficulty || 'Beginner'}</span>
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm mb-3">
            <span className="text-amber-500">{stars}</span>
            <span className="text-xs text-gray-400">({course.ratingCount || 0})</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{course.enrolledCount || 0} enrolled</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">{course.totalLessons || 0} lessons · {course.estimatedHours || 1}h</span>
            <span className="font-bold text-blue-600">{!course.price || course.price === 0 ? 'Free' : `$${course.price}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

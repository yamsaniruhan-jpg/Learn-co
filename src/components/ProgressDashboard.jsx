// src/components/ProgressDashboard.jsx
import { useState, useEffect } from 'react';
import { apiCall } from '../client/firebase';

export default function ProgressDashboard() {
  const [progress, setProgress] = useState([]);
  const [streak, setStreak] = useState(0);
  const [reviewCards, setReviewCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [progressRes, cardsRes] = await Promise.all([
        apiCall('/learning/progress'),
        apiCall('/learning/review-cards'),
      ]);
      const progressData = await progressRes.json();
      const cardsData = await cardsRes.json();
      
      const loadedProgress = progressData.progress || [];
      setProgress(loadedProgress);
      setReviewCards(cardsData.cards || []);

      const maxStreak = loadedProgress.reduce((max, p) => Math.max(max, p.streakDays || 0), 0);
      setStreak(maxStreak > 0 ? maxStreak : 1);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const overallProgress = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + (p.percentage || 0), 0) / progress.length)
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🔥" label="Streak" value={`${streak} days`} color="orange" />
        <StatCard icon="📊" label="Overall" value={`${overallProgress}%`} color="blue" />
        <StatCard icon="📚" label="Courses" value={progress.length} color="green" />
        <StatCard icon="🧠" label="Reviews Due" value={reviewCards.length} color="purple" />
      </div>

      {/* Course Progress */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Your Courses</h2>
        <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600">
          {progress.length} Active
        </span>
      </div>

      {progress.length === 0 && !loading ? (
        <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
          <p className="text-gray-500 mb-2">No course progress recorded yet.</p>
          <p className="text-xs text-gray-400">Complete lessons in Learn or Practice mode to track mastery here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {progress.map(course => (
            <div key={course.id || course.courseId} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">{course.title || course.courseId}</h3>
                <span className="text-sm font-semibold text-blue-600">{course.percentage || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${course.percentage || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {course.completedLessons || 0}/{course.totalLessons || 0} lessons · {course.timeSpentMinutes || 0} min spent
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Spaced Repetition */}
      {reviewCards.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">🧠 Review Time</h2>
          <ReviewCards cards={reviewCards} />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    orange: 'bg-orange-50 text-orange-600 border border-orange-200',
    blue: 'bg-blue-50 text-blue-600 border border-blue-200',
    green: 'bg-green-50 text-green-600 border border-green-200',
    purple: 'bg-purple-50 text-purple-600 border border-purple-200',
  };
  return (
    <div className={`${colors[color] || 'bg-gray-50 text-gray-700'} rounded-xl p-4 text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-80 mt-0.5">{label}</div>
    </div>
  );
}

function ReviewCards({ cards = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const safeCards = Array.isArray(cards) ? cards : [];

  if (!safeCards.length || currentIndex >= safeCards.length) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <p className="text-emerald-700 font-semibold text-base">✅ All caught up! Great job.</p>
        <p className="text-xs text-emerald-600 mt-1">Cards will resurface based on your SM-2 spaced repetition schedule.</p>
      </div>
    );
  }

  const card = safeCards[currentIndex];

  const handleRate = async (quality) => {
    try {
      await apiCall(`/learning/review-cards/${card.id}`, {
        method: 'POST',
        body: JSON.stringify({ quality }),
      });
    } catch (e) {
      console.warn('Failed to record card review:', e);
    }
    setShowAnswer(false);
    setCurrentIndex(prev => prev + 1);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Card {currentIndex + 1} of {safeCards.length}</p>
      {card.topic && (
        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 mb-3">
          {card.topic}
        </span>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-4">{card.question}</h3>
      {showAnswer ? (
        <>
          <div className="text-emerald-900 bg-emerald-50 border border-emerald-200 p-4 rounded-lg mb-5 text-left leading-relaxed">
            <span className="block text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Answer</span>
            {card.answer}
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleRate(1)}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg text-sm transition-colors"
            >
              😓 Hard
            </button>
            <button
              onClick={() => handleRate(3)}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium rounded-lg text-sm transition-colors"
            >
              🤔 Okay
            </button>
            <button
              onClick={() => handleRate(5)}
              className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium rounded-lg text-sm transition-colors"
            >
              😎 Easy
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setShowAnswer(true)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          Show Answer
        </button>
      )}
    </div>
  );
}

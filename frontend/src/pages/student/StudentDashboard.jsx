import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import TimeStatusBadge from '../../components/TimeStatusBadge';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import * as studentService from '../../services/studentService';

function QuizCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-ink/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1">
        <Skeleton className="h-5 w-40 mb-2.5" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-20 rounded-lg" />
    </div>
  );
}

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

function QuizCard({ quiz, onOpen }) {
  return (
    <div className="bg-white rounded-xl border border-ink/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
          <h3 className="font-display text-lg text-ink">{quiz.title}</h3>
          <TimeStatusBadge status={quiz.timeStatus} />
        </div>
        <p className="text-sm text-ink-soft">
          {quiz.duration} min &middot; Starts {formatDateTime(quiz.startTime)}
        </p>
      </div>
      <button
        onClick={() => onOpen(quiz)}
        className="text-sm font-medium text-white bg-indigo rounded-lg px-4 py-2 hover:bg-indigo-dark transition whitespace-nowrap"
      >
        View
      </button>
    </div>
  );
}

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [contestCode, setContestCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const loadQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentService.getAvailableQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!contestCode.trim()) {
      setJoinError('Enter a contest code.');
      return;
    }
    setJoining(true);
    try {
      const quiz = await studentService.joinContest(contestCode.trim());
      navigate(`/student/quiz/${quiz._id}/instructions`);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Could not join this contest.');
    } finally {
      setJoining(false);
    }
  };

  const openQuiz = (quiz) => {
    navigate(`/student/quiz/${quiz._id}/instructions`);
  };

  const ongoing = quizzes.filter((q) => q.timeStatus === 'ongoing');
  const upcoming = quizzes.filter((q) => q.timeStatus === 'upcoming');
  const completed = quizzes.filter((q) => q.timeStatus === 'completed');

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
          <div>
            <h1 className="font-display text-2xl text-ink mb-1">Welcome, {user?.name?.split(' ')[0]}</h1>
            <p className="text-ink-soft">
              Class {user?.class} - {user?.section}
            </p>
          </div>
          <Link to="/student/history" className="text-sm text-indigo hover:underline whitespace-nowrap">
            Attempt history
          </Link>
        </div>

        {/* Join contest */}
        <form onSubmit={handleJoin} className="bg-white rounded-xl border border-ink/10 p-5 mb-10">
          <label className="block text-sm font-medium text-ink mb-2">Have a contest code?</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={contestCode}
              onChange={(e) => setContestCode(e.target.value.toUpperCase())}
              placeholder="e.g. RVFV27"
              maxLength={6}
              className="flex-1 border border-ink/15 rounded-lg px-3.5 py-2.5 font-mono tracking-wider text-ink focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={joining}
              className="bg-indigo text-white font-medium rounded-lg px-5 py-2.5 hover:bg-indigo-dark disabled:opacity-50 transition whitespace-nowrap"
            >
              {joining ? 'Joining...' : 'Join'}
            </button>
          </div>
          {joinError && <p className="text-sm text-danger mt-2.5">{joinError}</p>}
        </form>

        {loading && (
          <div className="space-y-3">
            <QuizCardSkeleton />
            <QuizCardSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <EmptyState
            title="No quizzes yet"
            description="No quizzes available yet for your class. Check back later, or join with a contest code above."
          />
        )}

        {ongoing.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-ink-soft uppercase tracking-wide mb-3">Live now</h2>
            <div className="space-y-3">
              {ongoing.map((q) => (
                <QuizCard key={q._id} quiz={q} onOpen={openQuiz} />
              ))}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-ink-soft uppercase tracking-wide mb-3">Upcoming</h2>
            <div className="space-y-3">
              {upcoming.map((q) => (
                <QuizCard key={q._id} quiz={q} onOpen={openQuiz} />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-ink-soft uppercase tracking-wide mb-3">Completed</h2>
            <div className="space-y-3">
              {completed.map((q) => (
                <QuizCard key={q._id} quiz={q} onOpen={openQuiz} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;

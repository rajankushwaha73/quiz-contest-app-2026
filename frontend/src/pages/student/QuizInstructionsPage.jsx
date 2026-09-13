import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import TimeStatusBadge from '../../components/TimeStatusBadge';
import * as studentService from '../../services/studentService';

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

function QuizInstructionsPage() {
  const { user, logout } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentService.getQuizDetails(id);
        setQuiz(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this quiz.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleStart = () => {
    // The actual attempt engine (timer, questions, submit) is built in the next phase.
    navigate(`/student/quiz/${id}/attempt`);
  };

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <Link to="/student/dashboard" className="text-sm text-indigo hover:underline mb-4 inline-block">
          &larr; Back to your quizzes
        </Link>

        {loading && <p className="text-ink-soft text-sm">Loading...</p>}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">
            {error}
          </div>
        )}

        {!loading && quiz && (
          <div className="bg-white rounded-xl border border-ink/10 p-8">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <h1 className="font-display text-2xl text-ink">{quiz.title}</h1>
              <TimeStatusBadge status={quiz.timeStatus} />
            </div>
            {quiz.description && <p className="text-ink-soft mb-6">{quiz.description}</p>}

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-paper-dim rounded-lg p-3">
                <p className="text-ink-soft mb-0.5">Duration</p>
                <p className="font-medium text-ink">{quiz.duration} minutes</p>
              </div>
              <div className="bg-paper-dim rounded-lg p-3">
                <p className="text-ink-soft mb-0.5">Window</p>
                <p className="font-medium text-ink">
                  {formatDateTime(quiz.startTime)} - {formatDateTime(quiz.endTime)}
                </p>
              </div>
            </div>

            {quiz.instructions && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-ink mb-2">Instructions</h2>
                <p className="text-sm text-ink-soft whitespace-pre-line">{quiz.instructions}</p>
              </div>
            )}

            {quiz.timeStatus === 'ongoing' && (
              <button
                onClick={handleStart}
                className="bg-indigo text-white font-medium rounded-lg px-6 py-2.5 hover:bg-indigo-dark transition"
              >
                Start quiz
              </button>
            )}
            {quiz.timeStatus === 'upcoming' && (
              <p className="text-sm text-ink-soft">
                This quiz hasn't started yet. It opens at {formatDateTime(quiz.startTime)}.
              </p>
            )}
            {quiz.timeStatus === 'completed' && (
              <div>
                <p className="text-sm text-ink-soft mb-3">This quiz has ended.</p>
                <div className="flex gap-4">
                  <Link to={`/student/quiz/${id}/result`} className="text-indigo font-medium hover:underline text-sm">
                    View your result
                  </Link>
                  <Link
                    to={`/student/quiz/${id}/leaderboard`}
                    className="text-indigo font-medium hover:underline text-sm"
                  >
                    View leaderboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default QuizInstructionsPage;

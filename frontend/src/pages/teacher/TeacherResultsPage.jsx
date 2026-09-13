import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import * as teacherService from '../../services/teacherService';

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

function TeacherResultsPage() {
  const { user, logout } = useAuth();
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [releasing, setReleasing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teacherService.getQuizResults(id);
      setQuiz(data.quiz);
      setResults(data.results);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRelease = async () => {
    setReleasing(true);
    try {
      const updated = await teacherService.releaseResult(id);
      setQuiz((prev) => ({ ...prev, resultReleased: updated.resultReleased }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not release results.');
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link to="/teacher/dashboard" className="text-sm text-indigo hover:underline mb-4 inline-block">
          &larr; Back to your quizzes
        </Link>

        {loading && (
          <div className="bg-white rounded-xl border border-ink/10 p-5 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!loading && quiz && (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="font-display text-2xl text-ink mb-1">{quiz.title} - Results</h1>
                <p className="text-ink-soft text-sm">{results.length} submission{results.length !== 1 ? 's' : ''}</p>
              </div>
              {quiz.resultReleased ? (
                <span className="text-sm font-medium px-3.5 py-2 rounded-lg bg-success-soft text-success">
                  Results released to students
                </span>
              ) : (
                <button
                  onClick={handleRelease}
                  disabled={releasing || results.length === 0}
                  className="bg-indigo text-white font-medium rounded-lg px-5 py-2.5 hover:bg-indigo-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {releasing ? 'Releasing...' : 'Release results to students'}
                </button>
              )}
            </div>

            {results.length === 0 && <EmptyState title="No submissions yet" description="No students have submitted this quiz yet." />}

            {results.length > 0 && (
              <div className="bg-white rounded-xl border border-ink/10 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-paper-dim text-ink-soft text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                      <th className="px-4 py-3 font-medium">Correct</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Wrong</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Unanswered</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">Time</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.attemptId} className="border-t border-ink/5">
                        <td className="px-4 py-3 text-ink-soft">{r.rank}</td>
                        <td className="px-4 py-3 text-ink font-medium">{r.student.name}</td>
                        <td className="px-4 py-3 text-ink font-medium">
                          {r.score} / {r.totalMarks}
                        </td>
                        <td className="px-4 py-3 text-success">{r.correctCount}</td>
                        <td className="px-4 py-3 text-danger">{r.wrongCount}</td>
                        <td className="px-4 py-3 text-ink-soft">{r.unansweredCount}</td>
                        <td className="px-4 py-3 text-ink-soft">{formatDuration(r.timeTaken)}</td>
                        <td className="px-4 py-3 text-ink-soft">{formatDateTime(r.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default TeacherResultsPage;

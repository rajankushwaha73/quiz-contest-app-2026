import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import * as studentService from '../../services/studentService';

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function AttemptHistoryPage() {
  const { user, logout } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentService.getAttemptHistory();
        setHistory(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load your attempt history.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <Link to="/student/dashboard" className="text-sm text-indigo hover:underline mb-4 inline-block">
          &larr; Back to your quizzes
        </Link>

        <h1 className="font-display text-2xl text-ink mb-6">Your attempt history</h1>

        {loading && <p className="text-ink-soft text-sm">Loading...</p>}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-ink/15 p-10 text-center">
            <p className="text-ink-soft text-sm">You haven't submitted any quizzes yet.</p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.quizId}
                className="bg-white rounded-xl border border-ink/10 p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-ink mb-1">{h.quizTitle}</p>
                  <p className="text-xs text-ink-soft">Submitted {formatDateTime(h.submittedAt)}</p>
                </div>
                {h.resultReleased ? (
                  <Link
                    to={`/student/quiz/${h.quizId}/result`}
                    className="text-sm font-medium text-white bg-indigo rounded-lg px-4 py-2 hover:bg-indigo-dark transition whitespace-nowrap"
                  >
                    {h.score} / {h.totalMarks}
                  </Link>
                ) : (
                  <span className="text-xs text-ink-soft bg-paper-dim rounded-lg px-3 py-2 whitespace-nowrap">
                    Pending release
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AttemptHistoryPage;

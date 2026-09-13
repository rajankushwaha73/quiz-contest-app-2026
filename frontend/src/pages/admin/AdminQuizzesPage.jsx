import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import StatusBadge from '../../components/StatusBadge';
import * as adminService from '../../services/adminService';

function AdminQuizzesPage() {
  const { user, logout } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminService.getAllQuizzes();
        setQuizzes(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load quizzes.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link to="/admin/dashboard" className="text-sm text-indigo hover:underline mb-4 inline-block">
          &larr; Back to dashboard
        </Link>

        <h1 className="font-display text-2xl text-ink mb-6">All quizzes</h1>

        {loading && <p className="text-ink-soft text-sm">Loading...</p>}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">{error}</div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-ink/15 p-10 text-center">
            <p className="text-ink-soft text-sm">No quizzes have been created yet.</p>
          </div>
        )}

        {!loading && quizzes.length > 0 && (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="bg-white rounded-xl border border-ink/10 p-5">
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <h3 className="font-display text-lg text-ink">{quiz.title}</h3>
                  <StatusBadge status={quiz.status} />
                </div>
                <p className="text-sm text-ink-soft">
                  Class {quiz.class}-{quiz.section} &middot; By {quiz.createdBy?.name || 'Unknown'} &middot; Code:{' '}
                  <span className="font-mono">{quiz.contestCode}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminQuizzesPage;

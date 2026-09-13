import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import * as adminService from '../../services/adminService';

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function AdminResultsPage() {
  const { user, logout } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminService.getAllResults();
        setResults(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load results.');
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

        <h1 className="font-display text-2xl text-ink mb-6">All results</h1>

        {loading && <p className="text-ink-soft text-sm">Loading...</p>}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">{error}</div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-ink/15 p-10 text-center">
            <p className="text-ink-soft text-sm">No submissions yet.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="bg-white rounded-xl border border-ink/10 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-dim text-ink-soft text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Quiz</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.attemptId} className="border-t border-ink/5">
                    <td className="px-4 py-3 text-ink font-medium">{r.quizTitle}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {r.student.name} <span className="text-xs">({r.student.email})</span>
                    </td>
                    <td className="px-4 py-3 text-ink font-medium">
                      {r.score} / {r.totalMarks}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateTime(r.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminResultsPage;

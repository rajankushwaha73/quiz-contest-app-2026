import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import EmptyState from '../../components/EmptyState';
import * as studentService from '../../services/studentService';

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

function LeaderboardPage() {
  const { user, logout } = useAuth();
  const { id } = useParams();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notReleased, setNotReleased] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentService.getLeaderboard(id);
        setLeaderboard(data);
      } catch (err) {
        if (err.response?.status === 403) {
          setNotReleased(true);
        } else {
          setError(err.response?.data?.message || 'Could not load the leaderboard.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <Link to="/student/dashboard" className="text-sm text-indigo hover:underline mb-4 inline-block">
          &larr; Back to your quizzes
        </Link>

        <h1 className="font-display text-2xl text-ink mb-6">Leaderboard</h1>

        {loading && <p className="text-ink-soft text-sm">Loading...</p>}

        {!loading && notReleased && (
          <div className="bg-white rounded-xl border border-dashed border-ink/15 p-10 text-center">
            <p className="text-ink-soft text-sm">The leaderboard will be available once results are released.</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !notReleased && !error && leaderboard.length === 0 && (
          <EmptyState title="No submissions yet" description="No students have submitted this quiz yet." />
        )}

        {!loading && leaderboard.length > 0 && (
          <div className="bg-white rounded-xl border border-ink/10 overflow-hidden">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center justify-between px-5 py-3.5 border-t border-ink/5 first:border-t-0 ${
                  entry.isYou ? 'bg-indigo-soft' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink-soft w-6">{entry.rank}</span>
                  <span className={`text-sm ${entry.isYou ? 'text-indigo-dark font-semibold' : 'text-ink font-medium'}`}>
                    {entry.studentName} {entry.isYou && '(You)'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-ink-soft text-xs">{formatDuration(entry.timeTaken)}</span>
                  <span className="font-semibold text-ink">{entry.score} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default LeaderboardPage;

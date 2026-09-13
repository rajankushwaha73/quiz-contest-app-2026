import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BrandMark from '../../components/BrandMark';
import { getLeaderboardPreview } from '../../services/studentService';

// Clean Contest Leaderboard card preview for the landing page
function QuizCardMockup() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getLeaderboardPreview()
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch(() => {
        if (isMounted) setData(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const leaderboard = data?.leaderboard || [];

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-ink/5 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg text-ink">Contest Leaderboard</h2>
          {data?.class && data?.section && (
            <span className="text-xs font-semibold text-indigo-dark bg-indigo-soft px-2.5 py-1 rounded-full">
              Class {data.class}-{data.section}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 py-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse py-1">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-4 bg-ink/10 rounded" />
                  <div className="w-28 h-4 bg-ink/10 rounded" />
                </div>
                <div className="w-10 h-4 bg-ink/10 rounded" />
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-8 text-center text-ink-soft text-sm">
            <p className="font-medium text-ink">No submissions yet</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-ink-soft/70 uppercase tracking-wider pb-2.5 mb-1 border-b border-ink/5">
              <span className="w-12">Rank</span>
              <span className="flex-1">Name</span>
              <span className="text-right">Marks</span>
            </div>
            <div className="divide-y divide-ink/5">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between py-2.5 text-sm ${
                    entry.rank === 1 ? 'bg-amber-soft/50 -mx-2 px-2 rounded-lg' : ''
                  }`}
                >
                  <span className={`w-12 text-sm font-semibold ${entry.rank === 1 ? 'text-amber-dark' : 'text-ink-soft'}`}>
                    {entry.rank}
                  </span>
                  <span className="flex-1 font-medium text-ink truncate pr-2">
                    {entry.studentName}
                  </span>
                  <span className="font-semibold text-ink text-right whitespace-nowrap">
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <BrandMark />
        <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink transition">
          Log in
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="font-display text-5xl leading-[1.1] text-ink mb-5">
            Turn class quizzes into contests students look forward to.
          </h1>
          <p className="text-ink-soft text-lg mb-8 max-w-md">
            Teachers build the quiz and set the schedule. Students join with a
            code, race the clock, and see where they land on the leaderboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="bg-indigo text-white font-medium rounded-lg px-6 py-3 hover:bg-indigo-dark transition"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="bg-white text-ink font-medium rounded-lg px-6 py-3 border border-ink/10 hover:border-ink/25 transition"
            >
              I have an account
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <QuizCardMockup />
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-10 text-sm text-ink-soft/70">
        Built for school quiz contests — students, teachers, and admins.
      </footer>
    </div>
  );
}

export default LandingPage;

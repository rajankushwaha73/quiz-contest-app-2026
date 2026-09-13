import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import * as studentService from '../../services/studentService';

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

function ResultPage() {
  const { user, logout } = useAuth();
  const { id } = useParams();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notReleased, setNotReleased] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentService.getMyResult(id);
        setResult(data);
      } catch (err) {
        if (err.response?.status === 403) {
          setNotReleased(true);
        } else {
          setError(err.response?.data?.message || 'Could not load your result.');
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

        {loading && <p className="text-ink-soft text-sm">Loading your result...</p>}

        {!loading && notReleased && (
          <div className="bg-white rounded-xl border border-dashed border-ink/15 p-10 text-center">
            <p className="text-ink-soft text-sm">
              Your teacher hasn't released results for this quiz yet. Check back later.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">
            {error}
          </div>
        )}

        {!loading && result && (
          <>
            <div className="bg-white rounded-xl border border-ink/10 p-8 mb-6 text-center">
              <p className="text-ink-soft text-sm mb-2">Your score</p>
              <p className="font-display text-5xl text-ink mb-4">
                {result.score} <span className="text-2xl text-ink-soft">/ {result.totalMarks}</span>
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-success-soft rounded-lg p-3">
                  <p className="text-success font-semibold text-lg">{result.correctCount}</p>
                  <p className="text-ink-soft text-xs">Correct</p>
                </div>
                <div className="bg-danger-soft rounded-lg p-3">
                  <p className="text-danger font-semibold text-lg">{result.wrongCount}</p>
                  <p className="text-ink-soft text-xs">Wrong</p>
                </div>
                <div className="bg-paper-dim rounded-lg p-3">
                  <p className="text-ink font-semibold text-lg">{result.unansweredCount}</p>
                  <p className="text-ink-soft text-xs">Unanswered</p>
                </div>
              </div>
              <p className="text-ink-soft text-xs mt-4">Time taken: {formatDuration(result.timeTaken)}</p>
            </div>

            <Link
              to={`/student/quiz/${id}/leaderboard`}
              className="block text-center text-indigo font-medium hover:underline text-sm mb-8"
            >
              View leaderboard
            </Link>

            {result.breakdown && (
              <div>
                <h2 className="font-display text-lg text-ink mb-4">Answer review</h2>
                <div className="space-y-4">
                  {result.breakdown.map((q, index) => {
                    const wasCorrect = q.selectedOptionId === q.correctOptionId;
                    return (
                      <div key={index} className="bg-white rounded-xl border border-ink/10 p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <p className="font-medium text-ink">
                            {index + 1}. {q.questionText}
                          </p>
                          {q.selectedOptionId === null ? (
                            <span className="text-xs font-medium text-ink-soft bg-paper-dim px-2.5 py-1 rounded-full whitespace-nowrap">
                              Unanswered
                            </span>
                          ) : wasCorrect ? (
                            <span className="text-xs font-medium text-success bg-success-soft px-2.5 py-1 rounded-full whitespace-nowrap">
                              Correct
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-danger bg-danger-soft px-2.5 py-1 rounded-full whitespace-nowrap">
                              Incorrect
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {q.options.map((opt) => {
                            const isCorrect = opt._id === q.correctOptionId;
                            const isSelected = opt._id === q.selectedOptionId;
                            let style = 'text-ink-soft';
                            if (isCorrect) style = 'bg-success-soft text-success font-medium';
                            else if (isSelected && !isCorrect) style = 'bg-danger-soft text-danger font-medium';

                            return (
                              <div
                                key={opt._id}
                                className={`flex items-center justify-between text-sm px-3 py-1.5 rounded-lg ${style}`}
                              >
                                <span>{opt.text}</span>
                                <span className="text-xs font-normal">
                                  {isCorrect && isSelected && 'Your answer \u00b7 Correct'}
                                  {isCorrect && !isSelected && 'Correct answer'}
                                  {!isCorrect && isSelected && 'Your answer'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default ResultPage;

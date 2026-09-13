import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import * as studentService from '../../services/studentService';

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function QuizAttemptPage() {
  const { user, logout } = useAuth();
  const { id: quizId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [attemptId, setAttemptId] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // questionId -> selectedOptionId
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const hasFinalizedRef = useRef(false); // guards against double auto-submit
  const hasStartedRef = useRef(false); // guards against duplicate start calls (e.g. React StrictMode dev double-invoke)

  // ---- Load / start attempt ----
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const load = async () => {
      try {
        const data = await studentService.startAttempt(quizId);
        setAttemptId(data.attemptId);
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setRemainingSeconds(data.remainingSeconds);
        setAnswers(data.existingAnswers || {});
      } catch (err) {
        setError(err.response?.data?.message || 'Could not start this quiz.');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // ---- Submit (manual or auto) ----
  const doSubmit = useCallback(async () => {
    if (hasFinalizedRef.current || !attemptId) return;
    hasFinalizedRef.current = true;
    setSubmitting(true);
    try {
      await studentService.submitAttempt(attemptId);
      setSubmitted(true);
    } catch (err) {
      // Even if this fails (e.g. server already auto-finalized it), treat as submitted
      // from the student's perspective - there's nothing more they can do here.
      setSubmitError(err.response?.data?.message || '');
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [attemptId]);

  // ---- Timer countdown ----
  useEffect(() => {
    if (loading || error || submitted) return;
    if (remainingSeconds <= 0) {
      doSubmit();
      return;
    }
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          doSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, error, submitted, remainingSeconds, doSubmit]);

  const handleSelectOption = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    studentService.saveAnswer(attemptId, questionId, optionId).catch((err) => {
      // If the server says time's up, stop letting them interact and finalize.
      if (err.response?.status === 403) {
        doSubmit();
      }
    });
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const currentQuestion = questions[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-soft text-sm">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper">
        <DashboardHeader user={user} onLogout={logout} />
        <main className="max-w-xl mx-auto px-6 py-16 text-center">
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3 mb-6">
            {error}
          </div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-indigo font-medium hover:underline text-sm"
          >
            Back to your quizzes
          </button>
        </main>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-paper">
        <DashboardHeader user={user} onLogout={logout} />
        <main className="max-w-xl mx-auto px-6 py-16 text-center">
          <div className="bg-white rounded-xl border border-ink/10 p-10">
            <h1 className="font-display text-2xl text-ink mb-2">Quiz submitted</h1>
            <p className="text-ink-soft text-sm mb-1">
              Your answers have been recorded. Your result will be available once your teacher releases it.
            </p>
            {submitError && <p className="text-xs text-ink-soft/60 mt-2">{submitError}</p>}
            <button
              onClick={() => navigate('/student/dashboard')}
              className="mt-6 bg-indigo text-white font-medium rounded-lg px-6 py-2.5 hover:bg-indigo-dark transition"
            >
              Back to your quizzes
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isLowTime = remainingSeconds < 60;

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Top bar: question progress + timer */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-display text-lg text-ink">{quiz.title}</p>
            <p className="text-sm text-ink-soft">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 text-base font-semibold px-3.5 py-2 rounded-full ${
              isLowTime ? 'bg-danger-soft text-danger' : 'bg-amber-soft text-amber-dark'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {formatTime(remainingSeconds)}
          </div>
        </div>

        {/* Question navigator grid */}
        <div className="flex flex-wrap gap-2 mb-6">
          {questions.map((q, index) => {
            const isAnswered = answers[q._id] !== undefined;
            const isCurrent = index === currentIndex;
            return (
              <button
                key={q._id}
                onClick={() => setCurrentIndex(index)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition flex items-center justify-center
                  ${isCurrent ? 'ring-2 ring-indigo ring-offset-2 ring-offset-paper' : ''}
                  ${isAnswered ? 'bg-indigo text-white' : 'bg-white border border-ink/15 text-ink-soft'}
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        {/* Current question */}
        {currentQuestion && (
          <div className="bg-white rounded-xl border border-ink/10 p-6 mb-6">
            <p className="font-display text-lg text-ink mb-5 leading-snug">{currentQuestion.questionText}</p>
            <div className="space-y-2.5">
              {currentQuestion.options.map((opt) => {
                const selected = answers[currentQuestion._id] === opt._id;
                return (
                  <button
                    key={opt._id}
                    onClick={() => handleSelectOption(currentQuestion._id, opt._id)}
                    className={`w-full text-left flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                      selected
                        ? 'border-indigo bg-indigo-soft text-indigo-dark font-medium'
                        : 'border-ink/10 text-ink hover:border-ink/25'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        selected ? 'border-indigo bg-indigo' : 'border-ink/25'
                      }`}
                    />
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Prev/Next + Submit */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="text-sm font-medium text-ink border border-ink/15 rounded-lg px-4 py-2 hover:bg-paper-dim disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={currentIndex === questions.length - 1}
              className="text-sm font-medium text-ink border border-ink/15 rounded-lg px-4 py-2 hover:bg-paper-dim disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="bg-indigo text-white font-medium rounded-lg px-6 py-2 hover:bg-indigo-dark transition text-sm"
          >
            Submit quiz
          </button>
        </div>
      </main>

      <ConfirmDialog
        open={showConfirm}
        title="Submit this quiz?"
        message={
          unansweredCount > 0
            ? `You have ${unansweredCount} unanswered question${unansweredCount !== 1 ? 's' : ''}. Once submitted, you cannot change your answers.`
            : 'Once submitted, you cannot change your answers.'
        }
        confirmLabel={submitting ? 'Submitting...' : 'Submit'}
        danger={false}
        onConfirm={doSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

export default QuizAttemptPage;

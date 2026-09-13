import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import QuestionForm from '../../components/QuestionForm';
import ConfirmDialog from '../../components/ConfirmDialog';
import Skeleton from '../../components/Skeleton';
import GenerateQuestionsFromPDF from '../../components/GenerateQuestionsFromPDF';
import * as teacherService from '../../services/teacherService';

function QuestionCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-ink/10 p-5">
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

function ManageQuestionsPage() {
  const { user, logout } = useAuth();
  const { quizId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [showPdfPanel, setShowPdfPanel] = useState(false); // NEW (isolated AI feature)
  const [editingQuestion, setEditingQuestion] = useState(null); // question object being edited, or null
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [quizData, questionsData] = await Promise.all([
        teacherService.getQuizById(quizId),
        teacherService.getQuestions(quizId),
      ]);
      setQuiz(quizData);
      setQuestions(questionsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const handleAdd = async (payload) => {
    const newQuestion = await teacherService.addQuestion(quizId, payload);
    setQuestions((prev) => [...prev, newQuestion]);
    setShowAddForm(false);
  };

  const handleUpdate = async (payload) => {
    const updated = await teacherService.updateQuestion(editingQuestion._id, payload);
    setQuestions((prev) => prev.map((q) => (q._id === updated._id ? updated : q)));
    setEditingQuestion(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await teacherService.deleteQuestion(deleteTarget._id);
      setQuestions((prev) => prev.filter((q) => q._id !== deleteTarget._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this question.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/teacher/dashboard" className="text-sm text-indigo hover:underline mb-4 inline-block">
          &larr; Back to your quizzes
        </Link>

        {loading && (
          <div className="space-y-4">
            <QuestionCardSkeleton />
            <QuestionCardSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!loading && quiz && (
          <>
            <h1 className="font-display text-2xl text-ink mb-1">{quiz.title}</h1>
            <p className="text-ink-soft mb-8">
              {questions.length} question{questions.length !== 1 ? 's' : ''} &middot; Contest code:{' '}
              <span className="font-mono font-medium text-ink">{quiz.contestCode}</span>
            </p>

            <div className="space-y-4 mb-6">
              {questions.map((q, index) =>
                editingQuestion?._id === q._id ? (
                  <QuestionForm
                    key={q._id}
                    initialData={q}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditingQuestion(null)}
                  />
                ) : (
                  <div key={q._id} className="bg-white rounded-xl border border-ink/10 p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <p className="font-medium text-ink">
                        {index + 1}. {q.questionText}
                      </p>
                      <span className="text-xs text-ink-soft whitespace-nowrap">
                        {q.marks} mark{q.marks !== 1 ? 's' : ''}
                        {q.negativeMarks > 0 && ` · -${q.negativeMarks}`}
                      </span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {q.options.map((opt) => (
                        <div
                          key={opt._id}
                          className={`text-sm px-3 py-1.5 rounded-lg ${
                            opt._id === q.correctAnswer
                              ? 'bg-success-soft text-success font-medium'
                              : 'text-ink-soft'
                          }`}
                        >
                          {opt.text}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="text-xs font-medium text-ink border border-ink/15 rounded-lg px-3 py-1.5 hover:bg-paper-dim transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(q)}
                        className="text-xs font-medium text-danger border border-danger/20 rounded-lg px-3 py-1.5 hover:bg-danger-soft transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {questions.length === 0 && !showAddForm && (
              <div className="bg-white rounded-xl border border-dashed border-ink/15 p-8 text-center mb-6">
                <p className="text-ink-soft text-sm">No questions yet. Add your first one below.</p>
              </div>
            )}

            {/* NEW (isolated AI feature) - reuses the existing handleAdd function above,
                so accepted questions are saved exactly like manually-added ones */}
            {showPdfPanel && (
              <GenerateQuestionsFromPDF
                quizId={quizId}
                onAccept={handleAdd}
                onClose={() => setShowPdfPanel(false)}
              />
            )}

            {showAddForm ? (
              <QuestionForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full border-2 border-dashed border-ink/15 rounded-xl py-4 text-sm font-medium text-ink-soft hover:border-indigo hover:text-indigo transition"
                >
                  + Add question
                </button>
                {!showPdfPanel && (
                  <button
                    onClick={() => setShowPdfPanel(true)}
                    className="w-full border-2 border-dashed border-ink/15 rounded-xl py-4 text-sm font-medium text-ink-soft hover:border-indigo hover:text-indigo transition"
                  >
                    ✨ Generate questions from PDF
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this question?"
        message="This question will be permanently removed from the quiz."
        confirmLabel="Delete question"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default ManageQuestionsPage;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import * as teacherService from '../../services/teacherService';

function QuizCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-ink/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1">
        <Skeleton className="h-5 w-48 mb-2.5" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // quiz object pending delete confirmation
  const [actionError, setActionError] = useState('');

  const loadQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teacherService.getMyQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleTogglePublish = async (quiz) => {
    setActionError('');
    try {
      const updated = await teacherService.togglePublish(quiz._id);
      setQuizzes((prev) => prev.map((q) => (q._id === updated._id ? updated : q)));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not update quiz status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await teacherService.deleteQuiz(deleteTarget._id);
      setQuizzes((prev) => prev.filter((q) => q._id !== deleteTarget._id));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not delete quiz.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl text-ink mb-1">Your quizzes</h1>
            <p className="text-ink-soft">Create, edit, and publish quizzes for your students.</p>
          </div>
          <Link
            to="/teacher/quizzes/new"
            className="bg-indigo text-white font-medium rounded-lg px-5 py-2.5 hover:bg-indigo-dark transition whitespace-nowrap"
          >
            + Create quiz
          </Link>
        </div>

        {actionError && (
          <div className="mb-5 rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">
            {actionError}
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <QuizCardSkeleton />
            <QuizCardSkeleton />
            <QuizCardSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">{error}</div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <EmptyState
            title="No quizzes yet"
            description="Create your first quiz to get started."
            actionLabel="Create your first quiz"
            actionTo="/teacher/quizzes/new"
          />
        )}

        {!loading && quizzes.length > 0 && (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white rounded-xl border border-ink/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <h3 className="font-display text-lg text-ink">{quiz.title}</h3>
                    <StatusBadge status={quiz.status} />
                  </div>
                  <p className="text-sm text-ink-soft">
                    Class {quiz.class}-{quiz.section} &middot; {quiz.duration} min &middot; Code:{' '}
                    <span className="font-mono font-medium text-ink">{quiz.contestCode}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/teacher/quizzes/${quiz._id}/questions`}
                    className="text-sm font-medium text-ink border border-ink/15 rounded-lg px-3.5 py-2 hover:bg-paper-dim transition"
                  >
                    Questions
                  </Link>
                  <Link
                    to={`/teacher/quizzes/${quiz._id}/results`}
                    className="text-sm font-medium text-ink border border-ink/15 rounded-lg px-3.5 py-2 hover:bg-paper-dim transition"
                  >
                    Results
                  </Link>
                  <Link
                    to={`/teacher/quizzes/${quiz._id}/edit`}
                    className="text-sm font-medium text-ink border border-ink/15 rounded-lg px-3.5 py-2 hover:bg-paper-dim transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleTogglePublish(quiz)}
                    className="text-sm font-medium text-indigo border border-indigo/20 rounded-lg px-3.5 py-2 hover:bg-indigo-soft transition"
                  >
                    {quiz.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(quiz)}
                    className="text-sm font-medium text-danger border border-danger/20 rounded-lg px-3.5 py-2 hover:bg-danger-soft transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this quiz?"
        message={`"${deleteTarget?.title}" and all its questions will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete quiz"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default TeacherDashboard;

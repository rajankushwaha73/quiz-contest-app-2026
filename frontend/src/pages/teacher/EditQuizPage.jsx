import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import QuizForm from '../../components/QuizForm';
import * as teacherService from '../../services/teacherService';

function EditQuizPage() {
  const { user, logout } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const data = await teacherService.getQuizById(id);
        setQuiz(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this quiz.');
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [id]);

  const handleUpdate = async (payload) => {
    await teacherService.updateQuiz(id, payload);
    navigate('/teacher/dashboard');
  };

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Link to="/teacher/dashboard" className="text-sm text-indigo hover:underline mb-4 inline-block">
          &larr; Back to your quizzes
        </Link>
        <h1 className="font-display text-2xl text-ink mb-1">Edit quiz</h1>
        <p className="text-ink-soft mb-8">Update the details below.</p>

        {loading && <p className="text-ink-soft text-sm">Loading...</p>}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3 max-w-xl">
            {error}
          </div>
        )}

        {!loading && quiz && <QuizForm initialData={quiz} onSubmit={handleUpdate} submitLabel="Save changes" />}
      </main>
    </div>
  );
}

export default EditQuizPage;

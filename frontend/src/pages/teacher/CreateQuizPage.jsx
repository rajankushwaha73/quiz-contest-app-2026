import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import QuizForm from '../../components/QuizForm';
import * as teacherService from '../../services/teacherService';

function CreateQuizPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (payload) => {
    const quiz = await teacherService.createQuiz(payload);
    // Send them straight into adding questions - a quiz is useless without any
    navigate(`/teacher/quizzes/${quiz._id}/questions`);
  };

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display text-2xl text-ink mb-1">Create a quiz</h1>
        <p className="text-ink-soft mb-8">Set the details below. You can add questions next.</p>

        <QuizForm onSubmit={handleCreate} submitLabel="Create and add questions" />
      </main>
    </div>
  );
}

export default CreateQuizPage;

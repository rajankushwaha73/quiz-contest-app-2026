import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';

import StudentDashboard from './pages/student/StudentDashboard';
import QuizInstructionsPage from './pages/student/QuizInstructionsPage';
import QuizAttemptPage from './pages/student/QuizAttemptPage';
import ResultPage from './pages/student/ResultPage';
import LeaderboardPage from './pages/student/LeaderboardPage';
import AttemptHistoryPage from './pages/student/AttemptHistoryPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateQuizPage from './pages/teacher/CreateQuizPage';
import EditQuizPage from './pages/teacher/EditQuizPage';
import ManageQuestionsPage from './pages/teacher/ManageQuestionsPage';
import TeacherResultsPage from './pages/teacher/TeacherResultsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import AdminQuizzesPage from './pages/admin/AdminQuizzesPage';
import AdminResultsPage from './pages/admin/AdminResultsPage';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Student routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz/:id/instructions"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <QuizInstructionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz/:id/attempt"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <QuizAttemptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz/:id/result"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz/:id/leaderboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/history"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AttemptHistoryPage />
          </ProtectedRoute>
        }
      />

      {/* Teacher routes */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/quizzes/new"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <CreateQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/quizzes/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <EditQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/quizzes/:quizId/questions"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ManageQuestionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/quizzes/:id/results"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherResultsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageUsersPage role="student" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageUsersPage role="teacher" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/quizzes"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminQuizzesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/results"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminResultsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback - unknown routes go to landing */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

export default App;

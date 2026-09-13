import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import * as authService from '../../services/authService';

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a new password for your account."
      footer={
        <Link to="/login" className="text-indigo font-medium hover:underline">
          Back to log in
        </Link>
      }
    >
      {done ? (
        <div className="rounded-lg bg-success-soft border border-success/20 text-success text-sm px-4 py-3">
          Password reset successfully. Redirecting you to log in...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">
              {error}
            </div>
          )}
          <FormField
            label="New password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <FormField
            label="Confirm new password"
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo text-white font-medium rounded-lg py-2.5 hover:bg-indigo-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ResetPasswordPage;

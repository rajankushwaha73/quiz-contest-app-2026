import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import * as authService from '../../services/authService';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const msg = await authService.forgotPassword(email);
      setMessage(msg);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link to="/login" className="text-indigo font-medium hover:underline">
          Back to log in
        </Link>
      }
    >
      {message ? (
        <div className="rounded-lg bg-success-soft border border-success/20 text-success text-sm px-4 py-3">
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">
              {error}
            </div>
          )}
          <FormField
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.com"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo text-white font-medium rounded-lg py-2.5 hover:bg-indigo-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;

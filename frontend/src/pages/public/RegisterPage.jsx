import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    class: '',
    section: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email and password are required.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.role === 'student' && (!formData.class || !formData.section)) {
      setError('Class and section are required for students.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.role !== 'student') {
        delete payload.class;
        delete payload.section;
      }
      const user = await register(payload);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Set up your profile to get started."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-indigo font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-5 rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Full name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your name"
        />
        <FormField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@school.com"
        />
        <FormField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="At least 6 characters"
        />

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">I am a</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition bg-white"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        {formData.role === 'student' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Class"
              type="text"
              name="class"
              value={formData.class}
              onChange={handleChange}
              placeholder="e.g. 10"
            />
            <FormField
              label="Section"
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              placeholder="e.g. A"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo text-white font-medium rounded-lg py-2.5 hover:bg-indigo-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;

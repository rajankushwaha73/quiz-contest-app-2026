import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import * as adminService from '../../services/adminService';

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-ink/10 p-5">
      <p className="font-display text-3xl text-ink mb-1">{value}</p>
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function NavCard({ to, title, description }) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-ink/10 p-5 hover:border-indigo/40 transition block"
    >
      <p className="font-medium text-ink mb-1">{title}</p>
      <p className="text-sm text-ink-soft">{description}</p>
    </Link>
  );
}

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminService.getAnalytics();
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load analytics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display text-2xl text-ink mb-1">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="text-ink-soft mb-8">School-wide overview and management.</p>

        {loading && <p className="text-ink-soft text-sm mb-8">Loading analytics...</p>}
        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3 mb-8">
            {error}
          </div>
        )}

        {!loading && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
            <StatCard label="Students" value={stats.totalStudents} />
            <StatCard label="Teachers" value={stats.totalTeachers} />
            <StatCard label="Total quizzes" value={stats.totalQuizzes} />
            <StatCard label="Published" value={stats.publishedQuizzes} />
            <StatCard label="Submissions" value={stats.totalAttempts} />
          </div>
        )}

        <h2 className="text-sm font-semibold text-ink-soft uppercase tracking-wide mb-3">Manage</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <NavCard to="/admin/students" title="Students" description="View, activate/deactivate, or remove student accounts." />
          <NavCard to="/admin/teachers" title="Teachers" description="View, activate/deactivate, or remove teacher accounts." />
          <NavCard to="/admin/quizzes" title="All quizzes" description="View every quiz created across all teachers." />
          <NavCard to="/admin/results" title="All results" description="View every submitted attempt across the school." />
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;

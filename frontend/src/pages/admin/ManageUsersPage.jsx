import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import * as adminService from '../../services/adminService';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function AddUserForm({ role, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', class: '', section: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
    if (role === 'student' && (!formData.class || !formData.section)) {
      setError('Class and section are required for students.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ ...formData, role });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create user.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-ink/10 p-5 space-y-4 mb-6">
      {error && (
        <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">{error}</div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Full name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
        <FormField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@school.com" />
      </div>
      <FormField
        label="Temporary password"
        type="text"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="At least 6 characters"
      />
      {role === 'student' && (
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Class" type="text" name="class" value={formData.class} onChange={handleChange} placeholder="e.g. 10" />
          <FormField label="Section" type="text" name="section" value={formData.section} onChange={handleChange} placeholder="e.g. A" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo text-white font-medium rounded-lg px-5 py-2 hover:bg-indigo-dark disabled:opacity-50 transition text-sm"
        >
          {submitting ? 'Creating...' : `Create ${role}`}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-ink-soft hover:text-ink transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ManageUsersPage({ role }) {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getUsers(role);
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleCreate = async (payload) => {
    const newUser = await adminService.createUser(payload);
    setUsers((prev) => [{ ...newUser, createdAt: new Date().toISOString() }, ...prev]);
    setShowAddForm(false);
  };

  const handleToggleActive = async (u) => {
    setActionError('');
    try {
      const updated = await adminService.toggleUserActive(u._id);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isActive: updated.isActive } : x)));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not update user.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteUser(deleteTarget._id);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not delete user.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const roleLabel = role === 'student' ? 'Students' : 'Teachers';

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link to="/admin/dashboard" className="text-sm text-indigo hover:underline mb-4 inline-block">
          &larr; Back to dashboard
        </Link>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display text-2xl text-ink">{roleLabel}</h1>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo text-white font-medium rounded-lg px-5 py-2.5 hover:bg-indigo-dark transition"
            >
              + Add {role}
            </button>
          )}
        </div>

        {actionError && (
          <div className="mb-5 rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">
            {actionError}
          </div>
        )}

        {showAddForm && <AddUserForm role={role} onSubmit={handleCreate} onCancel={() => setShowAddForm(false)} />}

        {loading && <p className="text-ink-soft text-sm">Loading...</p>}

        {!loading && error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">{error}</div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-ink/15 p-10 text-center">
            <p className="text-ink-soft text-sm">No {role}s yet.</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="bg-white rounded-xl border border-ink/10 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-dim text-ink-soft text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  {role === 'student' && <th className="px-4 py-3 font-medium">Class/Section</th>}
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-ink/5">
                    <td className="px-4 py-3 text-ink font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                    {role === 'student' && (
                      <td className="px-4 py-3 text-ink-soft">
                        {u.class} - {u.section}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          u.isActive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="text-xs font-medium text-ink border border-ink/15 rounded-lg px-3 py-1.5 hover:bg-paper-dim transition"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="text-xs font-medium text-danger border border-danger/20 rounded-lg px-3 py-1.5 hover:bg-danger-soft transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete this ${role}?`}
        message={
          role === 'teacher'
            ? `"${deleteTarget?.name}" and all of their quizzes, questions, and student attempts on those quizzes will be permanently deleted.`
            : `"${deleteTarget?.name}" and their quiz attempt history will be permanently deleted.`
        }
        confirmLabel={`Delete ${role}`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default ManageUsersPage;

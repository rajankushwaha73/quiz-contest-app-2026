import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';

const ROLE_STYLES = {
  student: 'bg-indigo-soft text-indigo-dark',
  teacher: 'bg-amber-soft text-amber-dark',
  admin: 'bg-ink text-white',
};

const ROLE_LABELS = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Admin',
};

function DashboardHeader({ user, onLogout }) {
  return (
    <header className="bg-white border-b border-ink/10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_STYLES[user?.role]}`}>
            {ROLE_LABELS[user?.role]}
          </span>
          <span className="text-sm text-ink-soft hidden sm:inline">{user?.name}</span>
          <button
            onClick={onLogout}
            className="text-sm text-danger border border-danger/20 rounded-lg px-3 py-1.5 hover:bg-danger-soft transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;

import { Link } from 'react-router-dom';

// A simple, friendly inbox/document icon - generic enough to fit any "nothing here yet" context
function EmptyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-ink-soft/40 mx-auto mb-3">
      <rect x="7" y="10" width="26" height="22" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 18h7.5a2 2 0 0 1 1.8 1.1l.7 1.4a2 2 0 0 0 1.8 1.1h2.4a2 2 0 0 0 1.8-1.1l.7-1.4a2 2 0 0 1 1.8-1.1H33" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EmptyState({ title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-ink/15 p-10 text-center">
      <EmptyIcon />
      {title && <p className="text-ink font-medium text-sm mb-1">{title}</p>}
      {description && <p className="text-ink-soft text-sm mb-4">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="text-indigo font-medium hover:underline text-sm">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button onClick={onAction} className="text-indigo font-medium hover:underline text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;

const STYLES = {
  upcoming: 'bg-indigo-soft text-indigo-dark',
  ongoing: 'bg-success-soft text-success',
  completed: 'bg-paper-dim text-ink-soft',
};

const LABELS = {
  upcoming: 'Upcoming',
  ongoing: 'Live now',
  completed: 'Completed',
};

function TimeStatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STYLES[status] || STYLES.upcoming}`}>
      {LABELS[status] || status}
    </span>
  );
}

export default TimeStatusBadge;

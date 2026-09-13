const STATUS_STYLES = {
  draft: 'bg-paper-dim text-ink-soft',
  published: 'bg-success-soft text-success',
  unpublished: 'bg-amber-soft text-amber-dark',
};

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {status}
    </span>
  );
}

export default StatusBadge;

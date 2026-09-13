// A checked answer-bubble as the mark - ties directly to the MCQ/quiz subject
// instead of a generic abstract logo shape.
function BrandMark({ dark = false }) {
  const textColor = dark ? 'text-white' : 'text-ink';

  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        <circle cx="15" cy="15" r="14" stroke="currentColor" strokeWidth="2" className="text-amber" />
        <circle cx="15" cy="15" r="7" fill="currentColor" className="text-amber" />
      </svg>
      <span className={`font-display font-semibold text-lg tracking-tight ${textColor}`}>
        QuizContest
      </span>
    </div>
  );
}

export default BrandMark;

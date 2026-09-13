// A repeating pattern of answer-sheet bubbles (some filled) used as a
// decorative background layer. This is the recurring visual motif that
// connects the design back to "answering multiple-choice questions"
// instead of a generic gradient or abstract shape.
function QuizPatternBG({ className = '' }) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="bubbles" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
          <circle cx="37" cy="37" r="7" fill="currentColor" opacity="0.18" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#bubbles)" />
    </svg>
  );
}

export default QuizPatternBG;

import { useState } from 'react';

// initialData shape (when editing): { questionText, options: [{text}], correctAnswer, marks, negativeMarks }
function QuestionForm({ initialData, onSubmit, onCancel }) {
  const initialOptions = initialData?.options?.map((o) => o.text) || ['', ''];
  const initialCorrectIndex = initialData
    ? initialData.options.findIndex((o) => o._id === initialData.correctAnswer)
    : 0;

  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [options, setOptions] = useState(initialOptions);
  const [correctIndex, setCorrectIndex] = useState(initialCorrectIndex >= 0 ? initialCorrectIndex : 0);
  const [marks, setMarks] = useState(initialData?.marks ?? 1);
  const [negativeMarks, setNegativeMarks] = useState(initialData?.negativeMarks ?? 0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateOption = (index, value) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return; // must keep at least 2
    const next = options.filter((_, i) => i !== index);
    setOptions(next);
    if (correctIndex === index) {
      setCorrectIndex(0);
    } else if (correctIndex > index) {
      setCorrectIndex(correctIndex - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedOptions = options.map((o) => o.trim());
    if (!questionText.trim()) {
      setError('Question text is required.');
      return;
    }
    if (trimmedOptions.some((o) => !o)) {
      setError('All options must have text.');
      return;
    }
    if (marks === '' || Number(marks) < 0) {
      setError('Marks must be a non-negative number.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        questionText: questionText.trim(),
        options: trimmedOptions,
        correctOptionIndex: correctIndex,
        marks: Number(marks),
        negativeMarks: Number(negativeMarks) || 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this question.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-ink/10 p-5 space-y-4">
      {error && (
        <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Question text</label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={2}
          className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition"
          placeholder="Type the question here"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-2">
          Options <span className="text-ink-soft font-normal">(select the correct one)</span>
        </label>
        <div className="space-y-2.5">
          {options.map((opt, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <input
                type="radio"
                name="correctOption"
                checked={correctIndex === index}
                onChange={() => setCorrectIndex(index)}
                className="text-indigo focus:ring-indigo flex-shrink-0"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 border border-ink/15 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-ink-soft hover:text-danger text-sm px-1"
                  aria-label="Remove option"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="text-sm text-indigo hover:underline mt-2.5"
          >
            + Add option
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Marks</label>
          <input
            type="number"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            min="0"
            step="0.5"
            className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Negative marks</label>
          <input
            type="number"
            value={negativeMarks}
            onChange={(e) => setNegativeMarks(e.target.value)}
            min="0"
            step="0.5"
            className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo text-white font-medium rounded-lg px-5 py-2 hover:bg-indigo-dark disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
        >
          {submitting ? 'Saving...' : 'Save question'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-ink-soft hover:text-ink transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default QuestionForm;

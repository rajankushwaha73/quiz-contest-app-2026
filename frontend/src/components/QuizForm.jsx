import { useState } from 'react';
import FormField from './FormField';

// Converts an ISO date string to the format <input type="datetime-local"> expects
const toDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
};

function QuizForm({ initialData, onSubmit, submitLabel = 'Save' }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    instructions: initialData?.instructions || '',
    duration: initialData?.duration || '',
    startTime: toDatetimeLocal(initialData?.startTime),
    endTime: toDatetimeLocal(initialData?.endTime),
    class: initialData?.class || '',
    section: initialData?.section || '',
    negativeMarking: initialData?.settings?.negativeMarking || false,
    showAnswersAfterResult: initialData?.settings?.showAnswersAfterResult ?? true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.duration || !formData.startTime || !formData.endTime || !formData.class || !formData.section) {
      setError('Please fill in all required fields.');
      return;
    }
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      setError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        duration: Number(formData.duration),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        class: formData.class,
        section: formData.section,
        settings: {
          negativeMarking: formData.negativeMarking,
          showAnswersAfterResult: formData.showAnswersAfterResult,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {error && (
        <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3">{error}</div>
      )}

      <FormField
        label="Quiz title"
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="e.g. Science Chapter 4 Quiz"
      />

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={2}
          className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition"
          placeholder="Brief description shown to students"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Instructions</label>
        <textarea
          name="instructions"
          value={formData.instructions}
          onChange={handleChange}
          rows={3}
          className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition"
          placeholder="Shown to students before they start the quiz"
        />
      </div>

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

      <FormField
        label="Duration (minutes)"
        type="number"
        name="duration"
        value={formData.duration}
        onChange={handleChange}
        min="1"
        placeholder="e.g. 30"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Start time"
          type="datetime-local"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
        />
        <FormField
          label="End time"
          type="datetime-local"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="negativeMarking"
            checked={formData.negativeMarking}
            onChange={handleChange}
            className="rounded border-ink/25 text-indigo focus:ring-indigo"
          />
          Enable negative marking
        </label>
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="showAnswersAfterResult"
            checked={formData.showAnswersAfterResult}
            onChange={handleChange}
            className="rounded border-ink/25 text-indigo focus:ring-indigo"
          />
          Show correct/incorrect answers to students after result release
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-indigo text-white font-medium rounded-lg px-6 py-2.5 hover:bg-indigo-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

export default QuizForm;

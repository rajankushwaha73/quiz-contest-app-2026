import { useState } from 'react';
import * as aiService from '../services/aiService';

// This component only ever ADDS questions via the callback prop (onAccept),
// which the parent wires to its EXISTING handleAdd function - so accepted
// questions go through the exact same save path as manually-added ones.
// Nothing here writes to the quiz directly.
function GenerateQuestionsFromPDF({ quizId, onAccept, onClose }) {
  const [file, setFile] = useState(null);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState([]); // AI-generated questions pending review
  const [addingIndex, setAddingIndex] = useState(null);
  const [addingAll, setAddingAll] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please choose a PDF file first.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }

    setLoading(true);
    try {
      const generated = await aiService.generateQuestionsFromPDF(quizId, file, numberOfQuestions);
      setDrafts(generated);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toPayload = (draft) => ({
    questionText: draft.questionText,
    options: draft.options,
    correctOptionIndex: draft.correctOptionIndex,
    marks: draft.marks,
    negativeMarks: 0,
  });

  const handleAddOne = async (draft, index) => {
    setAddingIndex(index);
    try {
      await onAccept(toPayload(draft));
      setDrafts((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this question.');
    } finally {
      setAddingIndex(null);
    }
  };

  const handleDiscard = (index) => {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddAll = async () => {
    setAddingAll(true);
    setError('');
    try {
      // Sequential, not parallel - preserves question order in the quiz
      // and matches how a teacher adding them one-by-one would behave.
      for (const draft of drafts) {
        // eslint-disable-next-line no-await-in-loop
        await onAccept(toPayload(draft));
      }
      setDrafts([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add all questions. Some may have been added already.');
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-ink/10 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-ink">Generate questions from a PDF</h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Upload your notes or chapter PDF - AI will draft questions for you to review.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink text-sm">
          ✕
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-soft border border-danger/20 text-danger text-sm px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {drafts.length === 0 && (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">PDF file</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-ink-soft border border-ink/15 rounded-lg px-3.5 py-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-soft file:text-indigo-dark file:text-sm"
            />
          </div>
          <div className="max-w-[160px]">
            <label className="block text-sm font-medium text-ink mb-1.5">Number of questions</label>
            <input
              type="number"
              min="1"
              max="15"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(e.target.value)}
              className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo text-white font-medium rounded-lg px-5 py-2 hover:bg-indigo-dark disabled:opacity-50 transition text-sm"
          >
            {loading ? 'Generating...' : 'Generate questions'}
          </button>
        </form>
      )}

      {drafts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-ink-soft">{drafts.length} question(s) ready for review</p>
            <button
              onClick={handleAddAll}
              disabled={addingAll}
              className="text-sm font-medium text-white bg-indigo rounded-lg px-4 py-1.5 hover:bg-indigo-dark disabled:opacity-50 transition"
            >
              {addingAll ? 'Adding all...' : 'Add all to quiz'}
            </button>
          </div>
          <div className="space-y-3">
            {drafts.map((draft, index) => (
              <div key={index} className="border border-ink/10 rounded-lg p-4">
                <p className="font-medium text-ink text-sm mb-2.5">{draft.questionText}</p>
                <div className="space-y-1 mb-3">
                  {draft.options.map((opt, optIndex) => (
                    <div
                      key={optIndex}
                      className={`text-xs px-2.5 py-1.5 rounded-md ${
                        optIndex === draft.correctOptionIndex
                          ? 'bg-success-soft text-success font-medium'
                          : 'text-ink-soft'
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddOne(draft, index)}
                    disabled={addingIndex === index || addingAll}
                    className="text-xs font-medium text-white bg-indigo rounded-lg px-3 py-1.5 hover:bg-indigo-dark disabled:opacity-50 transition"
                  >
                    {addingIndex === index ? 'Adding...' : 'Add to quiz'}
                  </button>
                  <button
                    onClick={() => handleDiscard(index)}
                    disabled={addingAll}
                    className="text-xs font-medium text-ink-soft border border-ink/15 rounded-lg px-3 py-1.5 hover:bg-paper-dim transition"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerateQuestionsFromPDF;

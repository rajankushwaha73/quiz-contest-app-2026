/**
 * Text cleaning and character-overlapping chunker for PDF RAG pipeline.
 */

/**
 * Cleans extracted text by normalizing whitespace, removing null characters,
 * and standardizing line breaks.
 * @param {string} rawText
 * @returns {string}
 */
const cleanText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/\0/g, '') // remove null characters
    .replace(/\r\n/g, '\n') // normalize newlines
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ') // collapse repeated horizontal whitespace
    .replace(/\n{3,}/g, '\n\n') // collapse excessive blank lines
    .trim();
};

/**
 * Splits cleaned text into overlapping chunks using a sliding window.
 * Respects word boundaries whenever possible so terms are not cut in half.
 *
 * @param {string} text - Cleaned document text
 * @param {object} options - Chunking options
 * @param {number} options.chunkSize - Target chunk size in characters (default: 900)
 * @param {number} options.overlap - Overlap in characters (default: 150)
 * @returns {Array<{ chunkIndex: number, chunkText: string, charCount: number, tokenEstimate: number }>}
 */
const chunkText = (text, options = {}) => {
  const chunkSize = options.chunkSize || 900;
  const overlap = options.overlap || 150;

  if (!text || text.length === 0) {
    return [];
  }

  // If text is shorter than single chunk size, return single chunk
  if (text.length <= chunkSize) {
    return [
      {
        chunkIndex: 0,
        chunkText: text,
        charCount: text.length,
        tokenEstimate: Math.ceil(text.length / 4),
      },
    ];
  }

  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      // Find nearest whitespace/punctuation before endIndex to avoid cutting words
      const slice = text.substring(startIndex, endIndex);
      const lastBreak = slice.search(/[\s\n.,;!?][^\s\n.,;!?]*$/);
      if (lastBreak > chunkSize * 0.6) {
        endIndex = startIndex + lastBreak + 1;
      }
    }

    const chunkContent = text.substring(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        chunkIndex,
        chunkText: chunkContent,
        charCount: chunkContent.length,
        tokenEstimate: Math.ceil(chunkContent.length / 4),
      });
      chunkIndex++;
    }

    if (endIndex >= text.length) {
      break;
    }

    // Advance startIndex by (chunk length - overlap)
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
};

module.exports = {
  cleanText,
  chunkText,
};

// Generates a 6-character alphanumeric code (uppercase), avoiding visually
// confusing characters (0/O, 1/I) so students can type it in accurately.
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateContestCode = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
};

module.exports = generateContestCode;

/**
 * Generate unique formatted case number: YYYY/MM/COUNT (e.g. 2026/07/001)
 * @param {Array|number} casesOrIndex - Array of existing cases or direct numeric index
 * @param {Date|string} [customDate] - Target date (defaults to today)
 * @returns {string} Formatted case number
 */
export const generateCaseNumber = (casesOrIndex = [], customDate = new Date()) => {
  const now = customDate instanceof Date ? customDate : new Date(customDate || Date.now());
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${year}/${month}/`;

  if (typeof casesOrIndex === 'number') {
    const count = String(Math.max(1, casesOrIndex)).padStart(3, '0');
    return `${prefix}${count}`;
  }

  if (Array.isArray(casesOrIndex)) {
    let maxNum = 0;
    casesOrIndex.forEach((c) => {
      const cNum = c?.caseNumber || c?.case_number;
      if (cNum && typeof cNum === 'string' && cNum.startsWith(prefix)) {
        const parts = cNum.split('/');
        if (parts.length >= 3) {
          const numPart = parseInt(parts[2], 10);
          if (!isNaN(numPart) && numPart > maxNum) {
            maxNum = numPart;
          }
        }
      }
    });
    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `${prefix}${nextNum}`;
  }

  return `${prefix}001`;
};

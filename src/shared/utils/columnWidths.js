const { ALL_COLUMNS } = require('../constants/columns');
const { getCellText } = require('./formatters');

/**
 * Compute per-column width percentages based on content length.
 * Each column's weight is the max character length of its header and any cell
 * in that column. A minimum weight keeps short columns visible.
 */
function computeColumnWidths(activeColumns, issues) {
  const MIN_WEIGHT = 8;
  const weights = activeColumns.map((key) => {
    const col = ALL_COLUMNS.find((c) => c.key === key);
    const headerLen = (col?.label || key).length;
    let maxContentLen = headerLen;
    for (const issue of issues) {
      const txt = String(getCellText(issue, key) || '');
      if (txt.length > maxContentLen) maxContentLen = txt.length;
    }
    return Math.max(maxContentLen, MIN_WEIGHT);
  });
  const total = weights.reduce((sum, w) => sum + w, 0) || 1;
  const widths = {};
  activeColumns.forEach((key, idx) => {
    widths[key] = `${((weights[idx] / total) * 100).toFixed(4)}%`;
  });
  return widths;
}

module.exports = { computeColumnWidths };

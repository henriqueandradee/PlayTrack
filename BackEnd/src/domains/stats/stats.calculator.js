/**
 * Stats Calculator — server-side computation from Event records.
 * Evolution of the old src/utils/boxscoreCalc.js.
 *
 * This runs purely on data — no DB calls. Pass it an array of Event docs.
 */

const safeDiv = (numerator, denominator) =>
  denominator === 0 ? 0 : parseFloat((numerator / denominator).toFixed(4));

/**
 * Compute full basketball stats from an array of Event documents.
 * @param {Array} events - Array of Event model documents (non-deleted, category='stat')
 * @returns {{ aggregates, computed }}
 */
const computeFromEvents = (events) => {
  const agg = {
    pts: 0,
    fgm: 0, fga: 0,
    ftm: 0, fta: 0,
    '2ptm': 0, '2pta': 0,
    '3ptm': 0, '3pta': 0,
    reb: 0, ass: 0,
    rb: 0, err: 0,
  };

  for (const event of events) {
    if (event.category !== 'stat') continue;

    const v = event.value || 1;

    switch (event.actionType) {
      case '1PT_MADE': agg.ftm += v; agg.fta += v; break;
      case '1PT_MISS': agg.fta += v; break;
      case '2PT_MADE': agg['2ptm'] += v; agg['2pta'] += v; break;
      case '2PT_MISS': agg['2pta'] += v; break;
      case '3PT_MADE': agg['3ptm'] += v; agg['3pta'] += v; break;
      case '3PT_MISS': agg['3pta'] += v; break;
      case 'REB':  agg.reb += v; break;
      case 'ASS':  agg.ass += v; break;
      case 'RB':   agg.rb  += v; break;
      case 'ERR':  agg.err += v; break;
    }
  }

  // Derived totals
  agg.fgm = agg['2ptm'] + agg['3ptm'];
  agg.fga = agg['2pta'] + agg['3pta'];
  agg.pts = (agg.ftm * 1) + (agg['2ptm'] * 2) + (agg['3ptm'] * 3);

  // Computed percentages
  const computed = {
    fg_pct:       safeDiv(agg.fgm, agg.fga),
    two_pt_pct:   safeDiv(agg['2ptm'], agg['2pta']),
    three_pt_pct: safeDiv(agg['3ptm'], agg['3pta']),
    ft_pct:       safeDiv(agg.ftm, agg.fta),
    eff:          (agg.pts + agg.reb + agg.ass + agg.rb) - ((agg.fga - agg.fgm) + (agg.fta - agg.ftm) + agg.err),
  };

  return { aggregates: agg, computed };
};

module.exports = { computeFromEvents, safeDiv };

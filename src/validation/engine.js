/**
 * Compiles model/rulesByCube.js and validates Cube queries (timeDimensions + filters).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const rulesByCube = require('../../model/rulesByCube');

/** @returns {number | null} */
function spanDaysFromDateRange(dateRange) {
  if (Array.isArray(dateRange) && dateRange.length === 2) {
    const a = new Date(dateRange[0]);
    const b = new Date(dateRange[1]);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    return Math.ceil((hi - lo) / MS_PER_DAY);
  }
  if (typeof dateRange === 'string') {
    const m = dateRange.trim().match(/^last\s+(\d+)\s+days?$/i);
    return m ? parseInt(m[1], 10) : null;
  }
  return null;
}

/** @returns {number | null} */
function coerceInt(v) {
  if (typeof v === 'number' && Number.isInteger(v)) return v;
  if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return parseInt(v, 10);
  return null;
}

function compileRules(raw) {
  /** @type {Map<string, number>} */
  const dateRange = new Map();
  /** @type {Map<string, Set<string>>} */
  const stringList = new Map();
  /** @type {Map<string, { min: number; max: number }>} */
  const intRange = new Map();
  /** @type {Map<string, Set<number>>} */
  const intList = new Map();

  for (const [cube, rules] of Object.entries(raw || {})) {
    if (!Array.isArray(rules)) continue;
    for (const r of rules) {
      const member = `${cube}.${r.key}`;
      switch (r.type) {
        case 'dateRange':
          if (typeof r.maxDays !== 'number') {
            throw new Error(`rulesByCube: ${member} dateRange.maxDays must be a number`);
          }
          dateRange.set(member, r.maxDays);
          break;
        case 'stringList':
          stringList.set(member, new Set(r.allowed));
          break;
        case 'intRange':
          intRange.set(member, { min: r.min, max: r.max });
          break;
        case 'intList':
          intList.set(member, new Set(r.allowed));
          break;
        default:
          throw new Error(`rulesByCube: unknown type "${r.type}" for ${member}`);
      }
    }
  }

  return { dateRange, stringList, intRange, intList };
}

const compiled = compileRules(rulesByCube);

function validateDateRanges(query, dateRange) {
  const rows = query.timeDimensions;
  if (!rows?.length) return;

  for (const { dimension, dateRange: dr } of rows) {
    const maxDays = dateRange.get(dimension);
    if (maxDays == null) continue;

    const span = spanDaysFromDateRange(dr);
    if (span == null) {
      throw new Error(
        `Unsupported date range for ${dimension}. Use [start, end] or "Last N days" with N ≤ ${maxDays}.`,
      );
    }
    if (span > maxDays) {
      throw new Error(`Only ${maxDays} days of data are allowed for ${dimension}.`);
    }
  }
}

function assertEqualsOrIn(f) {
  const op = String(f.operator || '').toLowerCase();
  if (op !== 'equals' && op !== 'in') {
    throw new Error(`For ${f.member} only "equals" and "in" are allowed; got "${f.operator}".`);
  }
}

function validateStringListFilters(query, stringList) {
  const filters = query.filters;
  if (!filters?.length) return;

  for (const f of filters) {
    const allowed = stringList.get(f.member);
    if (!allowed) continue;

    assertEqualsOrIn(f);
    for (const v of f.values ?? []) {
      if (!allowed.has(v)) {
        throw new Error(
          `Invalid value for ${f.member}: "${v}". Allowed: ${[...allowed].join(', ')}.`,
        );
      }
    }
  }
}

function validateIntListFilters(query, intList) {
  const filters = query.filters;
  if (!filters?.length) return;

  for (const f of filters) {
    const allowed = intList.get(f.member);
    if (!allowed) continue;

    assertEqualsOrIn(f);
    for (const v of f.values ?? []) {
      const n = coerceInt(v);
      if (n === null || !allowed.has(n)) {
        throw new Error(
          `Invalid integer for ${f.member}: "${v}". Allowed: ${[...allowed].join(', ')}.`,
        );
      }
    }
  }
}

function validateIntRangeFilters(query, intRange) {
  const filters = query.filters;
  if (!filters?.length) return;

  for (const f of filters) {
    const bounds = intRange.get(f.member);
    if (!bounds) continue;

    const op = String(f.operator || '').toLowerCase();
    const vals = f.values ?? [];
    const { min, max } = bounds;
    const inRange = (n) => n !== null && n >= min && n <= max;

    if (op === 'equals' || op === 'in') {
      for (const v of vals) {
        const n = coerceInt(v);
        if (!inRange(n)) {
          throw new Error(`Invalid value for ${f.member}: "${v}". Must be an integer in [${min}, ${max}].`);
        }
      }
      continue;
    }

    if (op === 'gt' || op === 'gte' || op === 'lt' || op === 'lte') {
      if (vals.length !== 1) {
        throw new Error(`Invalid filter for ${f.member}: expected one value for operator "${f.operator}".`);
      }
      const n = coerceInt(vals[0]);
      if (!inRange(n)) {
        throw new Error(`Invalid bound for ${f.member}: "${vals[0]}". Must be an integer in [${min}, ${max}].`);
      }
      continue;
    }

    throw new Error(`Unsupported operator "${f.operator}" for integer range on ${f.member}.`);
  }
}

/**
 * @param {object} query Cube query
 * @param {{ securityContext?: object }} [_opts] reserved (e.g. role-based rules later)
 */
function validateQuery(query, _opts) {
  validateDateRanges(query, compiled.dateRange);
  validateStringListFilters(query, compiled.stringList);
  validateIntListFilters(query, compiled.intList);
  validateIntRangeFilters(query, compiled.intRange);
}

module.exports = {
  validateQuery,
  compileRules,
};

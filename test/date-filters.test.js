import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  blogDate,
  currentYear,
  getDate,
  getMonthYear,
  UTCdate,
} from '../lib/nunjucks-filters/date-filters.js';

describe('currentYear', () => {
  it('returns the current year as a number', () => {
    const year = currentYear();
    assert.equal(typeof year, 'number');
    assert.equal(year, new Date().getFullYear());
  });
});

describe('UTCdate', () => {
  it('formats a Date object to UTC string', () => {
    const date = new Date('2025-06-15T12:00:00Z');
    assert.equal(UTCdate(date), date.toUTCString());
  });

  it('formats a date string to UTC string', () => {
    const result = UTCdate('2025-01-01T00:00:00Z');
    assert.ok(result.includes('2025'));
    assert.ok(result.includes('Jan') || result.includes('Wed'));
  });
});

describe('blogDate', () => {
  it('formats as Month Day, Year', () => {
    const result = blogDate('2025-03-15');
    assert.ok(result.includes('March'));
    assert.ok(result.includes('2025'));
  });
});

describe('getDate', () => {
  it('formats as dd/mm/yyyy', () => {
    const result = getDate('2025-03-05T00:00:00Z');
    assert.match(result, /^\d{2}\/\d{2}\/\d{4}$/);
    assert.ok(result.includes('2025'));
  });

  it('zero-pads single-digit day and month', () => {
    const result = getDate('2025-01-02T12:00:00Z');
    assert.ok(result.includes('/01/'));
    assert.match(result, /^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('returns a date when called with no argument', () => {
    const result = getDate();
    assert.match(result, /^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe('getMonthYear', () => {
  it('formats as Month Year', () => {
    const result = getMonthYear('2025-06-15');
    assert.ok(result.includes('June') || result.includes('June'));
    assert.ok(result.includes('2025'));
  });

  it('returns month and year when called with no argument', () => {
    const result = getMonthYear();
    const year = new Date().getFullYear().toString();
    assert.ok(result.includes(year));
  });
});

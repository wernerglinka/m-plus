import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getArrayLength,
  getSelections,
  isArray,
  isRelated,
  toArray,
} from '../lib/nunjucks-filters/array-filters.js';

describe('getSelections', () => {
  const list = [
    { title: 'Alpha', id: 1 },
    { title: 'Beta', id: 2 },
    { title: 'Gamma', id: 3 },
  ];

  it('filters by matching titles', () => {
    const result = getSelections(list, ['Alpha', 'Gamma']);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 1);
    assert.equal(result[1].id, 3);
  });

  it('matches case-insensitively', () => {
    const result = getSelections(list, ['alpha', 'BETA']);
    assert.equal(result.length, 2);
  });

  it('returns empty array when no matches', () => {
    const result = getSelections(list, ['Delta']);
    assert.equal(result.length, 0);
  });

  it('returns empty array for empty selections', () => {
    const result = getSelections(list, []);
    assert.equal(result.length, 0);
  });
});

describe('toArray', () => {
  it('splits space-separated string into sorted unique array', () => {
    assert.deepStrictEqual(toArray('banana apple cherry'), ['apple', 'banana', 'cherry']);
  });

  it('deduplicates repeated words', () => {
    assert.deepStrictEqual(toArray('a b a c b'), ['a', 'b', 'c']);
  });

  it('handles single word', () => {
    assert.deepStrictEqual(toArray('hello'), ['hello']);
  });
});

describe('getArrayLength', () => {
  it('returns the length of an array', () => {
    assert.equal(getArrayLength([1, 2, 3]), 3);
  });

  it('returns 0 for empty array', () => {
    assert.equal(getArrayLength([]), 0);
  });
});

describe('isArray', () => {
  it('returns true for arrays', () => {
    assert.equal(isArray([]), true);
    assert.equal(isArray([1, 2]), true);
  });

  it('returns false for non-arrays', () => {
    assert.equal(isArray({}), false);
    assert.equal(isArray('string'), false);
    assert.equal(isArray(42), false);
    assert.equal(isArray(null), false);
  });
});

describe('isRelated', () => {
  const selections = [{ item: 'a' }, { item: 'b' }, { item: 'c' }];

  it('returns true when post.item is in selections', () => {
    assert.equal(isRelated({ item: 'b' }, selections), true);
  });

  it('returns false when post.item is not in selections', () => {
    assert.equal(isRelated({ item: 'z' }, selections), false);
  });

  it('returns false for empty selections', () => {
    assert.equal(isRelated({ item: 'a' }, []), false);
  });
});

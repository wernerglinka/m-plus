import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import deepMerge from '../lib/deep-merge.js';

describe('deepMerge', () => {
  it('merges flat objects', () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    assert.deepStrictEqual(result, { a: 1, b: 2 });
  });

  it('overrides values from source', () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    assert.deepStrictEqual(result, { a: 2 });
  });

  it('deep merges nested objects', () => {
    const target = { a: { b: 1, c: 2 } };
    const source = { a: { c: 3, d: 4 } };
    assert.deepStrictEqual(deepMerge(target, source), { a: { b: 1, c: 3, d: 4 } });
  });

  it('replaces arrays instead of concatenating', () => {
    const target = { a: [1, 2, 3] };
    const source = { a: [4, 5] };
    assert.deepStrictEqual(deepMerge(target, source), { a: [4, 5] });
  });

  it('does not mutate the target object', () => {
    const target = { a: { b: 1 } };
    const source = { a: { c: 2 } };
    deepMerge(target, source);
    assert.deepStrictEqual(target, { a: { b: 1 } });
  });

  it('handles empty source', () => {
    const target = { a: 1, b: { c: 2 } };
    assert.deepStrictEqual(deepMerge(target, {}), { a: 1, b: { c: 2 } });
  });

  it('handles empty target', () => {
    const source = { a: 1, b: { c: 2 } };
    assert.deepStrictEqual(deepMerge({}, source), { a: 1, b: { c: 2 } });
  });

  it('replaces object with array when source has array', () => {
    const target = { a: { b: 1 } };
    const source = { a: [1, 2] };
    assert.deepStrictEqual(deepMerge(target, source), { a: [1, 2] });
  });

  it('replaces array with object when source has object', () => {
    const target = { a: [1, 2] };
    const source = { a: { b: 1 } };
    assert.deepStrictEqual(deepMerge(target, source), { a: { b: 1 } });
  });

  it('handles three-layer merge matching config layering', () => {
    const defaults = { a: 1, b: { c: 2, d: 3 }, e: [1] };
    const fileConfig = { b: { c: 10 }, e: [2, 3] };
    const overrides = { b: { d: 20 } };
    const result = deepMerge(deepMerge(defaults, fileConfig), overrides);
    assert.deepStrictEqual(result, { a: 1, b: { c: 10, d: 20 }, e: [2, 3] });
  });
});

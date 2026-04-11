import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { merge, mergeProps, normalizeIcon } from '../lib/nunjucks-filters/object-filters.js';

describe('normalizeIcon', () => {
  it('converts a string to an icon object', () => {
    assert.deepStrictEqual(normalizeIcon('star'), { icon: 'star', url: null, title: null });
  });

  it('passes through a valid icon object', () => {
    const input = { icon: 'star', url: '/page', title: 'Star' };
    assert.deepStrictEqual(normalizeIcon(input), { icon: 'star', url: '/page', title: 'Star' });
  });

  it('fills missing url and title with null', () => {
    assert.deepStrictEqual(normalizeIcon({ icon: 'star' }), {
      icon: 'star',
      url: null,
      title: null,
    });
  });

  it('returns null icon for invalid input', () => {
    assert.deepStrictEqual(normalizeIcon(null), { icon: null, url: null, title: null });
    assert.deepStrictEqual(normalizeIcon(undefined), { icon: null, url: null, title: null });
    assert.deepStrictEqual(normalizeIcon(42), { icon: null, url: null, title: null });
  });

  it('returns null icon for object without icon property', () => {
    assert.deepStrictEqual(normalizeIcon({ url: '/page' }), { icon: null, url: null, title: null });
  });
});

describe('mergeProps', () => {
  it('merges properties into each item', () => {
    const items = [{ name: 'A' }, { name: 'B' }];
    const result = mergeProps(items, { active: true });
    assert.deepStrictEqual(result, [
      { name: 'A', active: true },
      { name: 'B', active: true },
    ]);
  });

  it('overrides existing properties', () => {
    const items = [{ name: 'A', active: false }];
    const result = mergeProps(items, { active: true });
    assert.deepStrictEqual(result, [{ name: 'A', active: true }]);
  });

  it('returns items unchanged for invalid propsToMerge', () => {
    const items = [{ a: 1 }];
    assert.deepStrictEqual(mergeProps(items, null), items);
  });

  it('returns items unchanged for non-array items', () => {
    assert.equal(mergeProps('not-array', { a: 1 }), 'not-array');
  });

  it('does not mutate original items', () => {
    const items = [{ name: 'A' }];
    mergeProps(items, { extra: true });
    assert.deepStrictEqual(items, [{ name: 'A' }]);
  });
});

describe('merge', () => {
  it('merges properties into an object', () => {
    assert.deepStrictEqual(merge({ a: 1 }, { b: 2 }), { a: 1, b: 2 });
  });

  it('overrides existing properties', () => {
    assert.deepStrictEqual(merge({ a: 1 }, { a: 2 }), { a: 2 });
  });

  it('returns obj unchanged for invalid propsToMerge', () => {
    const obj = { a: 1 };
    assert.equal(merge(obj, null), obj);
  });

  it('returns obj unchanged for invalid obj', () => {
    assert.equal(merge(null, { a: 1 }), null);
  });

  it('does not mutate original object', () => {
    const obj = { a: 1 };
    merge(obj, { b: 2 });
    assert.deepStrictEqual(obj, { a: 1 });
  });
});

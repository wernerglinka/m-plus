import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  debugCollections,
  myDump,
  objToString,
  safeDump,
} from '../lib/nunjucks-filters/debug-filters.js';

describe('objToString', () => {
  it('stringifies an object', () => {
    assert.equal(objToString({ a: 1 }), '{"a":1}');
  });

  it('stringifies an array', () => {
    assert.equal(objToString([1, 2]), '[1,2]');
  });

  it('stringifies null', () => {
    assert.equal(objToString(null), 'null');
  });
});

describe('myDump', () => {
  it('pretty-prints with 4-space indent', () => {
    const result = myDump({ a: 1 });
    assert.ok(result.includes('    "a": 1'));
  });

  it('handles circular references without throwing', () => {
    const obj = {};
    obj.self = obj;
    const result = myDump(obj);
    assert.equal(typeof result, 'string');
  });
});

describe('safeDump', () => {
  it('pretty-prints with 4-space indent', () => {
    const result = safeDump({ a: 1 });
    assert.ok(result.includes('    "a": 1'));
  });

  it('marks circular references', () => {
    const obj = {};
    obj.self = obj;
    const result = safeDump(obj);
    assert.ok(result.includes('[Circular Reference]'));
  });

  it('handles null', () => {
    assert.equal(safeDump(null), 'null');
  });
});

describe('debugCollections', () => {
  it('extracts metadata from collection arrays', () => {
    const collections = {
      posts: [
        {
          title: 'Post 1',
          path: '/post-1',
          permalink: '/post-1/',
          card: { date: '2025-01-01', excerpt: 'Intro' },
        },
        { card: { title: 'Post 2' }, path: '/post-2', permalink: '/post-2/' },
      ],
    };
    const result = JSON.parse(debugCollections(collections));
    assert.equal(result.posts.length, 2);
    assert.equal(result.posts[0].title, 'Post 1');
    assert.equal(result.posts[1].title, 'Post 2');
  });

  it('notes non-array collection values as type string', () => {
    const collections = { count: 42 };
    const result = JSON.parse(debugCollections(collections));
    assert.equal(result.count, '[number]');
  });

  it('handles empty collections', () => {
    const result = JSON.parse(debugCollections({}));
    assert.deepStrictEqual(result, {});
  });

  it('uses fallback title when neither card.title nor title exist', () => {
    const collections = {
      posts: [{ path: '/p' }],
    };
    const result = JSON.parse(debugCollections(collections));
    assert.equal(result.posts[0].title, 'No title');
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  condenseTitle,
  spaceToDash,
  toLower,
  toUpper,
  trimSlashes,
  trimString,
} from '../lib/nunjucks-filters/string-filters.js';

describe('toLower', () => {
  it('converts to lowercase', () => {
    assert.equal(toLower('HELLO'), 'hello');
  });

  it('handles mixed case', () => {
    assert.equal(toLower('Hello World'), 'hello world');
  });

  it('leaves lowercase unchanged', () => {
    assert.equal(toLower('already'), 'already');
  });
});

describe('toUpper', () => {
  it('converts to uppercase', () => {
    assert.equal(toUpper('hello'), 'HELLO');
  });

  it('handles mixed case', () => {
    assert.equal(toUpper('Hello World'), 'HELLO WORLD');
  });
});

describe('spaceToDash', () => {
  it('replaces single spaces with dashes', () => {
    assert.equal(spaceToDash('hello world'), 'hello-world');
  });

  it('replaces multiple consecutive spaces with a single dash', () => {
    assert.equal(spaceToDash('hello   world'), 'hello-world');
  });

  it('handles leading and trailing spaces', () => {
    assert.equal(spaceToDash(' hello '), '-hello-');
  });

  it('returns unchanged string with no spaces', () => {
    assert.equal(spaceToDash('hello'), 'hello');
  });
});

describe('condenseTitle', () => {
  it('removes spaces and lowercases', () => {
    assert.equal(condenseTitle('Hello World'), 'helloworld');
  });

  it('collapses multiple spaces', () => {
    assert.equal(condenseTitle('A  B  C'), 'abc');
  });

  it('handles already condensed string', () => {
    assert.equal(condenseTitle('abc'), 'abc');
  });
});

describe('trimSlashes', () => {
  it('removes leading slash', () => {
    assert.equal(trimSlashes('/hello'), 'hello');
  });

  it('removes trailing slash', () => {
    assert.equal(trimSlashes('hello/'), 'hello');
  });

  it('removes both leading and trailing slashes', () => {
    assert.equal(trimSlashes('/hello/'), 'hello');
  });

  it('preserves middle slashes', () => {
    assert.equal(trimSlashes('/a/b/c/'), 'a/b/c');
  });

  it('handles string with no slashes', () => {
    assert.equal(trimSlashes('hello'), 'hello');
  });
});

describe('trimString', () => {
  it('trims long string and adds ellipsis', () => {
    assert.equal(trimString('hello world', 5), 'hello...');
  });

  it('returns string unchanged when shorter than length', () => {
    assert.equal(trimString('hi', 10), 'hi');
  });

  it('returns string unchanged when equal to length', () => {
    assert.equal(trimString('hello', 5), 'hello');
  });

  it('handles zero length', () => {
    assert.equal(trimString('hello', 0), '...');
  });
});

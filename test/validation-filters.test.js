import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  hasAuthor,
  hasCtas,
  hasIcon,
  hasImage,
  hasItems,
  hasText,
  hasUrl,
  isExternal,
  isString,
} from '../lib/nunjucks-filters/validation-filters.js';

describe('isExternal', () => {
  it('returns true for https URLs', () => {
    assert.equal(isExternal('https://example.com'), true);
  });

  it('returns true for http URLs', () => {
    assert.equal(isExternal('http://example.com'), true);
  });

  it('returns true for protocol-relative URLs', () => {
    assert.equal(isExternal('//example.com'), true);
  });

  it('returns false for relative paths', () => {
    assert.equal(isExternal('/about'), false);
  });

  it('returns false for null and undefined', () => {
    assert.equal(isExternal(null), false);
    assert.equal(isExternal(undefined), false);
  });

  it('returns false for non-string values', () => {
    assert.equal(isExternal(42), false);
  });
});

describe('isString', () => {
  it('returns true for strings', () => {
    assert.equal(isString('hello'), true);
    assert.equal(isString(''), true);
  });

  it('returns false for non-strings', () => {
    assert.equal(isString(42), false);
    assert.equal(isString(null), false);
    assert.equal(isString([]), false);
  });
});

describe('hasImage', () => {
  it('returns true for valid image object', () => {
    assert.equal(hasImage({ src: '/img/photo.jpg' }), true);
  });

  it('returns falsy for empty src', () => {
    assert.ok(!hasImage({ src: '' }));
    assert.ok(!hasImage({ src: '   ' }));
  });

  it('returns falsy for missing src', () => {
    assert.ok(!hasImage({}));
  });

  it('returns falsy for null', () => {
    assert.ok(!hasImage(null));
  });
});

describe('hasCtas', () => {
  it('returns true when at least one CTA has url and label', () => {
    assert.equal(hasCtas([{ url: '/page', label: 'Click' }]), true);
  });

  it('returns false for empty array', () => {
    assert.equal(hasCtas([]), false);
  });

  it('returns false for non-array', () => {
    assert.equal(hasCtas(null), false);
  });

  it('returns false when CTAs have empty url or label', () => {
    assert.equal(hasCtas([{ url: '', label: 'Click' }]), false);
    assert.equal(hasCtas([{ url: '/page', label: '' }]), false);
    assert.equal(hasCtas([{ url: '  ', label: '  ' }]), false);
  });

  it('returns true if any CTA is valid among invalid ones', () => {
    const ctas = [
      { url: '', label: '' },
      { url: '/valid', label: 'Valid' },
    ];
    assert.equal(hasCtas(ctas), true);
  });
});

describe('hasText', () => {
  it('returns true when title exists', () => {
    assert.equal(hasText({ title: 'Hello' }), true);
  });

  it('returns true when prose exists', () => {
    assert.equal(hasText({ prose: 'Some content' }), true);
  });

  it('returns true when leadIn exists', () => {
    assert.equal(hasText({ leadIn: 'Intro' }), true);
  });

  it('returns true when subTitle exists', () => {
    assert.equal(hasText({ subTitle: 'Sub' }), true);
  });

  it('returns falsy when all fields are empty', () => {
    assert.ok(!hasText({ title: '', prose: '', leadIn: '', subTitle: '' }));
  });

  it('returns falsy for whitespace-only fields', () => {
    assert.ok(!hasText({ title: '   ' }));
  });

  it('returns false for null', () => {
    assert.equal(hasText(null), false);
  });

  it('returns false for non-object', () => {
    assert.equal(hasText('string'), false);
  });
});

describe('hasAuthor', () => {
  it('returns true for non-empty string', () => {
    assert.equal(hasAuthor('Jane Doe'), true);
  });

  it('returns true for array with non-empty strings', () => {
    assert.equal(hasAuthor(['Jane', 'John']), true);
  });

  it('returns false for empty string', () => {
    assert.equal(hasAuthor(''), false);
    assert.equal(hasAuthor('   '), false);
  });

  it('returns false for empty array', () => {
    assert.equal(hasAuthor([]), false);
  });

  it('returns false for array of empty strings', () => {
    assert.equal(hasAuthor(['', '  ']), false);
  });

  it('returns false for null and undefined', () => {
    assert.equal(hasAuthor(null), false);
    assert.equal(hasAuthor(undefined), false);
  });
});

describe('hasUrl', () => {
  it('returns true for non-empty URL', () => {
    assert.equal(hasUrl('/about'), true);
  });

  it('returns false for empty or whitespace', () => {
    assert.equal(hasUrl(''), false);
    assert.equal(hasUrl('   '), false);
  });

  it('returns false for null and non-string', () => {
    assert.equal(hasUrl(null), false);
    assert.equal(hasUrl(42), false);
  });
});

describe('hasItems', () => {
  it('returns true for non-empty array', () => {
    assert.equal(hasItems([1]), true);
  });

  it('returns true for non-empty object', () => {
    assert.equal(hasItems({ a: 1 }), true);
  });

  it('returns false for empty array', () => {
    assert.equal(hasItems([]), false);
  });

  it('returns false for empty object', () => {
    assert.equal(hasItems({}), false);
  });

  it('returns false for null and undefined', () => {
    assert.equal(hasItems(null), false);
    assert.equal(hasItems(undefined), false);
  });
});

describe('hasIcon', () => {
  it('returns true for object with non-empty icon string', () => {
    assert.equal(hasIcon({ icon: 'star' }), true);
  });

  it('returns falsy for empty icon', () => {
    assert.ok(!hasIcon({ icon: '' }));
    assert.ok(!hasIcon({ icon: '   ' }));
  });

  it('returns falsy for missing icon property', () => {
    assert.ok(!hasIcon({}));
  });

  it('returns false for non-string icon', () => {
    assert.equal(hasIcon({ icon: 42 }), false);
  });

  it('returns false for null', () => {
    assert.equal(hasIcon(null), false);
  });
});

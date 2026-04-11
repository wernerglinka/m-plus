/**
 * Shared utilities for marked extensions.
 *
 * Provides common functions used across multiple extensions
 * for parsing class attributes and building HTML elements.
 *
 * @module @wernerglinka/marked-extensions-shared
 */

/**
 * Extract class names from an attribute string.
 * Accepts dot-prefixed class names like ".float-right .hero-image"
 * following the Pandoc/kramdown convention.
 *
 * @param {string} attributeString - Raw attribute string from curly braces
 * @returns {string} Space-separated class names without dots
 *
 * @example
 * parseClassNames('.float-right .rounded');
 * // => 'float-right rounded'
 */
function parseClassNames(attributeString) {
  return attributeString
    .split(/\s+/)
    .filter((token) => token.startsWith('.'))
    .map((token) => token.slice(1))
    .join(' ');
}

/**
 * Build an HTML img element from token properties.
 *
 * @param {Object} properties - Image properties
 * @param {string} properties.src - Image source URL
 * @param {string} properties.alt - Alt text
 * @param {string} [properties.title] - Optional title attribute
 * @returns {string} HTML img element
 *
 * @example
 * buildImageTag({ src: '/photo.jpg', alt: 'A photo', title: 'My photo' });
 * // => '<img src="/photo.jpg" alt="A photo" title="My photo">'
 */
function buildImageTag({ src, alt, title }) {
  const titleAttribute = title ? ` title="${title}"` : '';
  return `<img src="${src}" alt="${alt}"${titleAttribute}>`;
}

/**
 * Wrap an HTML string in a div with the given classes.
 *
 * @param {string} innerHtml - HTML content to wrap
 * @param {string} classes - Space-separated class names
 * @returns {string} Wrapped HTML
 *
 * @example
 * wrapWithDiv('<img src="photo.jpg">', 'float-right rounded');
 * // => '<div class="float-right rounded"><img src="photo.jpg"></div>\n'
 */
function wrapWithDiv(innerHtml, classes) {
  return `<div class="${classes}">${innerHtml}</div>\n`;
}

/**
 * Build a container class string from a base class and optional extras.
 * Filters out empty strings and joins with spaces.
 *
 * @param {string} baseClass - The default class for the container
 * @param {string} [extraClasses] - Additional classes from directive attributes
 * @returns {string} Combined class string
 *
 * @example
 * buildContainerClasses('audio-player', 'featured');
 * // => 'audio-player featured'
 *
 * buildContainerClasses('cta-container', '');
 * // => 'cta-container'
 */
function buildContainerClasses(baseClass, extraClasses) {
  return [baseClass, extraClasses].filter(Boolean).join(' ');
}

export { parseClassNames, buildImageTag, wrapWithDiv, buildContainerClasses };

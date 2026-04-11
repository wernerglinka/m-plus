/**
 * marked extension: link-with-class
 *
 * Extends standard Markdown link syntax with class attributes.
 * Renders as an inline anchor with the specified classes.
 *
 * Syntax:
 *   [Link Text](/url){.classname}
 *   [Link Text](/url){.btn .btn-primary}
 *   [Link Text](/url "title"){.btn .btn-outline}
 *
 * Output:
 *   <a href="/url" class="btn btn-primary">Link Text</a>
 *
 * For grouped CTAs with a container div, use the directive extension
 * with the :::cta block syntax instead.
 *
 * Usage:
 *   import { marked } from 'marked';
 *   import linkWithClass from '@wernerglinka/marked-link-with-class';
 *
 *   marked.use({ extensions: [linkWithClass()] });
 *
 *   const html = marked.parse('[Sign Up](/register){.btn .btn-primary}');
 *
 * @module @wernerglinka/marked-link-with-class
 */

import { parseClassNames } from '@wernerglinka/marked-extensions-shared';

/**
 * Pattern for matching link-with-class syntax.
 * Must not be preceded by '!' to avoid matching images.
 *
 * Captures: link text, href, optional title, class attributes
 *
 * Breakdown:
 *   (?<!!)\[([^\]]+)\]     - link text, negative lookbehind excludes images
 *   \((\S+?)               - href (non-greedy, no whitespace)
 *   (?:\s+"([^"]*)")?\)    - optional title in quotes
 *   \{([^}]+)\}            - class attributes in curly braces
 */
const LINK_WITH_CLASS_PATTERN =
  /^(?<!!)\[([^\]]+)\]\((\S+?)(?:\s+"([^"]*)")?\)\{([^}]+)\}/;

/**
 * Build an HTML anchor element from token properties.
 *
 * @param {Object} properties - Link properties
 * @param {string} properties.href - Link URL
 * @param {string} properties.text - Link text content
 * @param {string} properties.classes - Space-separated class names
 * @param {string} [properties.title] - Optional title attribute
 * @returns {string} HTML anchor element
 */
function buildAnchorTag({ href, text, classes, title }) {
  const titleAttribute = title ? ` title="${title}"` : '';
  return `<a href="${href}" class="${classes}"${titleAttribute}>${text}</a>`;
}

/**
 * Create the marked extension object for link-with-class.
 *
 * @returns {Object} A marked inline extension definition
 */
function linkWithClass() {
  return {
    name: 'linkWithClass',
    level: 'inline',

    /**
     * Find the start index of a potential link-with-class token.
     * Skips image syntax by checking for preceding '!'.
     *
     * @param {string} source - Raw Markdown source text
     * @returns {number} Index of the first '[' not preceded by '!', or -1
     */
    start(source) {
      const index = source.indexOf('[');
      if (index === -1) {
        return -1;
      }
      if (index > 0 && source[index - 1] === '!') {
        return source.indexOf('[', index + 1);
      }
      return index;
    },

    /**
     * Tokenize a link-with-class from the source string.
     *
     * @param {string} source - Remaining Markdown source
     * @returns {Object|undefined} Token object or undefined if no match
     */
    tokenizer(source) {
      const match = LINK_WITH_CLASS_PATTERN.exec(source);

      if (!match) {
        return undefined;
      }

      const [raw, text, href, title, attributes] = match;
      const classes = parseClassNames(attributes);

      return {
        type: 'linkWithClass',
        raw,
        text,
        href,
        title: title ?? '',
        classes,
      };
    },

    /**
     * Render the link-with-class token as an inline anchor.
     *
     * @param {Object} token - Parsed token from the tokenizer
     * @returns {string} HTML anchor element
     */
    renderer(token) {
      return buildAnchorTag({
        href: token.href,
        text: token.text,
        classes: token.classes,
        title: token.title,
      });
    },
  };
}

export default linkWithClass;
export { buildAnchorTag };

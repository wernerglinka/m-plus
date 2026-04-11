/**
 * marked extension: image-with-class
 *
 * Extends standard Markdown image syntax with class attributes.
 * Wraps the image in a <div> with the specified classes.
 *
 * Syntax:
 *   ![alt text](image.jpg){.classname}
 *   ![alt text](image.jpg){.class-one .class-two}
 *
 * Output:
 *   <div class="classname"><img src="image.jpg" alt="alt text"></div>
 *   <div class="class-one class-two"><img src="image.jpg" alt="alt text"></div>
 *
 * Usage:
 *   import { marked } from 'marked';
 *   import imageWithClass from '@wernerglinka/marked-image-with-class';
 *
 *   marked.use({ extensions: [imageWithClass()] });
 *
 *   const html = marked.parse('![photo](hero.jpg){.float-right}');
 *
 * @module @wernerglinka/marked-image-with-class
 */

import {
  parseClassNames,
  buildImageTag,
  wrapWithDiv,
} from '@wernerglinka/marked-extensions-shared';

/**
 * Pattern for matching image-with-class syntax.
 * Captures: alt text, src, optional title, class attributes
 *
 * Breakdown:
 *   !\[([^\]]*)\]          - alt text in square brackets
 *   \((\S+?)               - src (non-greedy, no whitespace)
 *   (?:\s+"([^"]*)")?\)    - optional title in quotes
 *   \{([^}]+)\}            - class attributes in curly braces
 */
const IMAGE_WITH_CLASS_PATTERN =
  /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)\{([^}]+)\}/;

/**
 * Create the marked extension object for image-with-class.
 *
 * @returns {Object} A marked inline extension definition
 */
function imageWithClass() {
  return {
    name: 'imageWithClass',
    level: 'inline',

    /**
     * Find the start index of a potential image-with-class token.
     *
     * @param {string} source - Raw Markdown source text
     * @returns {number} Index of the first '![' sequence, or -1
     */
    start(source) {
      return source.indexOf('![');
    },

    /**
     * Tokenize an image-with-class from the source string.
     *
     * @param {string} source - Remaining Markdown source
     * @returns {Object|undefined} Token object or undefined if no match
     */
    tokenizer(source) {
      const match = IMAGE_WITH_CLASS_PATTERN.exec(source);

      if (!match) {
        return undefined;
      }

      const [raw, alt, src, title, attributes] = match;
      const classes = parseClassNames(attributes);

      return {
        type: 'imageWithClass',
        raw,
        alt,
        src,
        title: title ?? '',
        classes,
      };
    },

    /**
     * Render the image-with-class token as HTML.
     *
     * @param {Object} token - Parsed token from the tokenizer
     * @returns {string} HTML output
     */
    renderer(token) {
      const imageTag = buildImageTag({
        src: token.src,
        alt: token.alt,
        title: token.title,
      });

      return wrapWithDiv(imageTag, token.classes);
    },
  };
}

export default imageWithClass;

/**
 * marked extension: directive-block
 *
 * Adds a generic block-level directive syntax to Markdown using
 * triple-colon fences. Each directive type has its own renderer,
 * registered through a simple registry pattern.
 *
 * Syntax:
 *   :::type
 *   content here
 *   :::
 *
 *   :::type{.class-one .class-two}
 *   content here
 *   :::
 *
 * Built-in directive types:
 *
 *   :::cta
 *   [Link Text](/url){.btn .btn-primary}
 *   [Another Link](/url2){.btn-link}
 *   :::
 *
 *   :::audio
 *   src: /media/episode-01.mp3
 *   title: The First Episode
 *   :::
 *
 *   :::video
 *   src: /media/intro.mp4
 *   poster: /images/intro-poster.jpg
 *   :::
 *
 *   :::quote
 *   The best way to predict the future is to invent it.
 *   cite: Alan Kay
 *   :::
 *
 *   :::figure{.wide}
 *   ![Ruhr Valley factory](/images/factory.jpg)
 *   caption: Dortmund steelworks, 1973
 *   :::
 *
 *   :::aside{.note}
 *   This requires Node.js 20 or higher.
 *   :::
 *
 *   :::details
 *   summary: How does this work?
 *   The build pipeline processes each section sequentially...
 *   :::
 *
 * Custom directive types can be added via the renderers option:
 *
 *   directiveBlock({
 *     renderers: {
 *       pullquote: (body, classes) => `<blockquote class="pullquote ${classes}">${body}</blockquote>`
 *     }
 *   })
 *
 * Usage:
 *   import { marked } from 'marked';
 *   import directiveBlock from '@wernerglinka/marked-directive-block';
 *
 *   marked.use({ extensions: [directiveBlock()] });
 *
 * @module @wernerglinka/marked-directive-block
 */

import {
  parseClassNames,
  buildContainerClasses,
} from '@wernerglinka/marked-extensions-shared';

/**
 * Pattern for matching directive block syntax.
 *
 * Captures: directive type, optional attributes, body content
 *
 * Breakdown:
 *   ^:::(\w+)              - opening fence with directive type name
 *   (?:\s*\{([^}]+)\})?    - optional class attributes in curly braces
 *   \n                     - newline after opening fence
 *   ([\s\S]*?)             - body content (non-greedy)
 *   \n:::                  - closing fence
 *   (?:\s*$|\n)            - end of line or newline after closing fence
 */
const DIRECTIVE_BLOCK_PATTERN =
  /^:::(\w+)(?:\s*\{([^}]+)\})?\n([\s\S]*?)\n:::(?:\s*$|\n)/;

/**
 * Parse key-value props from a directive body.
 * Each line should be in "key: value" format.
 *
 * @param {string} body - Raw body content from the directive
 * @returns {Object} Parsed key-value pairs
 */
function parseProps(body) {
  return body
    .split('\n')
    .filter((line) => line.includes(':'))
    .reduce((props, line) => {
      const separatorIndex = line.indexOf(':');
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      return { ...props, [key]: value };
    }, {});
}

/**
 * Separate prop lines from content lines in a directive body.
 * Lines matching "key: value" at the start are treated as props.
 * Everything else is content.
 *
 * @param {string} body - Raw directive body
 * @param {Array<string>} propNames - Prop keys to extract
 * @returns {{ props: Object, content: string }} Extracted props and remaining content
 */
function extractPropsAndContent(body, propNames) {
  const lines = body.split('\n');
  const props = {};
  const contentLines = [];

  for (const line of lines) {
    const trimmed = line.trimStart();
    const matchedProp = propNames.find((name) => trimmed.startsWith(`${name}:`));

    if (matchedProp) {
      props[matchedProp] = trimmed.slice(trimmed.indexOf(':') + 1).trim();
    } else {
      contentLines.push(line);
    }
  }

  return {
    props,
    content: contentLines.join('\n').trim(),
  };
}

/**
 * Parse CTA links from the directive body.
 * Matches links with optional class attributes.
 *
 * @param {string} body - Raw body content containing markdown links
 * @returns {Array<Object>} Array of link objects with text, href, and classes
 */
function parseCtaLinks(body) {
  const linkPattern = /\[([^\]]+)\]\((\S+?)(?:\s+"([^"]*)")?\)(?:\{([^}]+)\})?/g;

  const links = [];
  let match;

  while ((match = linkPattern.exec(body)) !== null) {
    const [, text, href, title, attributes] = match;
    links.push({
      text,
      href,
      title: title ?? '',
      classes: attributes ? parseClassNames(attributes) : '',
    });
  }

  return links;
}

/**
 * Render a CTA directive as a container with grouped links.
 *
 * @param {string} body - Raw directive body with markdown links
 * @param {string} classes - Additional classes from the directive fence
 * @returns {string} HTML output
 */
function renderCta(body, classes) {
  const links = parseCtaLinks(body);

  if (links.length === 0) {
    return '';
  }

  const containerClasses = buildContainerClasses('cta-container', classes);

  const anchors = links
    .map(({ href, text, classes: linkClasses, title }) => {
      const classAttribute = linkClasses ? ` class="${linkClasses}"` : '';
      const titleAttribute = title ? ` title="${title}"` : '';
      return `<a href="${href}"${classAttribute}${titleAttribute}>${text}</a>`;
    })
    .join('\n  ');

  return `<div class="${containerClasses}">\n  ${anchors}\n</div>\n`;
}

/**
 * Render an audio directive as an audio player.
 *
 * @param {string} body - Raw directive body with key-value props
 * @param {string} classes - Additional classes from the directive fence
 * @returns {string} HTML output
 */
function renderAudio(body, classes) {
  const props = parseProps(body);

  if (!props.src) {
    return '';
  }

  const containerClasses = buildContainerClasses('audio-player', classes);
  const title = props.title ? `<p class="audio-title">${props.title}</p>\n  ` : '';

  return `<div class="${containerClasses}">\n  ${title}<audio controls src="${props.src}"></audio>\n</div>\n`;
}

/**
 * Render a video directive as a video player.
 *
 * @param {string} body - Raw directive body with key-value props
 * @param {string} classes - Additional classes from the directive fence
 * @returns {string} HTML output
 */
function renderVideo(body, classes) {
  const props = parseProps(body);

  if (!props.src) {
    return '';
  }

  const containerClasses = buildContainerClasses('video-player', classes);
  const posterAttribute = props.poster ? ` poster="${props.poster}"` : '';

  return `<div class="${containerClasses}">\n  <video controls src="${props.src}"${posterAttribute}></video>\n</div>\n`;
}

/**
 * Render a quote directive as a blockquote with optional citation.
 * Lines that are not key-value props are treated as the quote text.
 *
 * @param {string} body - Raw directive body
 * @param {string} classes - Additional classes from the directive fence
 * @returns {string} HTML output
 */
function renderQuote(body, classes) {
  const { props, content } = extractPropsAndContent(body, ['cite']);

  if (!content) {
    return '';
  }

  const containerClasses = buildContainerClasses('blockquote', classes);
  const citation = props.cite ? `\n  <cite>${props.cite}</cite>` : '';

  return `<blockquote class="${containerClasses}">\n  <p>${content}</p>${citation}\n</blockquote>\n`;
}

/**
 * Render a figure directive with image and optional caption.
 * Expects a Markdown image inside the body and an optional caption prop.
 *
 * @param {string} body - Raw directive body with image syntax and props
 * @param {string} classes - Additional classes from the directive fence
 * @returns {string} HTML output
 */
function renderFigure(body, classes) {
  const imagePattern = /!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)/;
  const imageMatch = imagePattern.exec(body);

  if (!imageMatch) {
    return '';
  }

  const [, alt, src, title] = imageMatch;
  const titleAttribute = title ? ` title="${title}"` : '';
  const imageTag = `<img src="${src}" alt="${alt}"${titleAttribute}>`;

  const { props } = extractPropsAndContent(body, ['caption']);
  const containerClasses = buildContainerClasses('figure', classes);
  const figcaption = props.caption ? `\n  <figcaption>${props.caption}</figcaption>` : '';

  return `<figure class="${containerClasses}">\n  ${imageTag}${figcaption}\n</figure>\n`;
}

/**
 * Render an aside directive as a styled aside element.
 * The full body is treated as the aside content.
 *
 * @param {string} body - Raw directive body
 * @param {string} classes - Additional classes from the directive fence
 * @returns {string} HTML output
 */
function renderAside(body, classes) {
  if (!body) {
    return '';
  }

  const containerClasses = buildContainerClasses('aside', classes);

  return `<aside class="${containerClasses}">\n  <p>${body}</p>\n</aside>\n`;
}

/**
 * Render a details directive as a collapsible disclosure element.
 * Expects a summary prop; remaining lines become the content.
 *
 * @param {string} body - Raw directive body with summary prop and content
 * @param {string} classes - Additional classes from the directive fence
 * @returns {string} HTML output
 */
function renderDetails(body, classes) {
  const { props, content } = extractPropsAndContent(body, ['summary']);

  if (!props.summary) {
    return '';
  }

  const containerClasses = buildContainerClasses('details', classes);

  return `<details class="${containerClasses}">\n  <summary>${props.summary}</summary>\n  <p>${content}</p>\n</details>\n`;
}

/**
 * Default renderer registry mapping directive types to render functions.
 * Each renderer receives (body, classes) and returns an HTML string.
 */
const DEFAULT_RENDERERS = {
  cta: renderCta,
  audio: renderAudio,
  video: renderVideo,
  quote: renderQuote,
  figure: renderFigure,
  aside: renderAside,
  details: renderDetails,
};

/**
 * Create the marked extension object for directive blocks.
 *
 * @param {Object} [options] - Extension options
 * @param {Object} [options.renderers] - Additional or override renderers
 * @returns {Object} A marked block extension definition
 */
function directiveBlock(options = {}) {
  const renderers = { ...DEFAULT_RENDERERS, ...options.renderers };

  return {
    name: 'directiveBlock',
    level: 'block',

    /**
     * Find the start index of a potential directive block.
     *
     * @param {string} source - Raw Markdown source text
     * @returns {number} Index of the first ':::' sequence, or -1
     */
    start(source) {
      return source.indexOf(':::');
    },

    /**
     * Tokenize a directive block from the source string.
     *
     * @param {string} source - Remaining Markdown source
     * @returns {Object|undefined} Token object or undefined if no match
     */
    tokenizer(source) {
      const match = DIRECTIVE_BLOCK_PATTERN.exec(source);

      if (!match) {
        return undefined;
      }

      const [raw, type, attributes, body] = match;
      const classes = attributes ? parseClassNames(attributes) : '';

      return {
        type: 'directiveBlock',
        raw,
        directiveType: type,
        body: body.trim(),
        classes,
      };
    },

    /**
     * Render the directive block token as HTML.
     * Dispatches to the appropriate renderer based on directive type.
     *
     * @param {Object} token - Parsed token from the tokenizer
     * @returns {string} HTML output
     */
    renderer(token) {
      const renderFunction = renderers[token.directiveType];

      if (!renderFunction) {
        console.warn(`Unknown directive type: "${token.directiveType}"`);
        return '';
      }

      return renderFunction(token.body, token.classes);
    },
  };
}

export default directiveBlock;
export {
  parseProps,
  extractPropsAndContent,
  parseCtaLinks,
  renderCta,
  renderAudio,
  renderVideo,
  renderQuote,
  renderFigure,
  renderAside,
  renderDetails,
};

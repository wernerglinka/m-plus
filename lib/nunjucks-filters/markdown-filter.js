import bash from '@shikijs/langs/bash';
import css from '@shikijs/langs/css';
import html from '@shikijs/langs/html';
// Load language grammars as plain objects for sync usage
import javascript from '@shikijs/langs/javascript';
import jinja from '@shikijs/langs/jinja';
import json from '@shikijs/langs/json';
import markdown from '@shikijs/langs/markdown';
import typescript from '@shikijs/langs/typescript';
import yaml from '@shikijs/langs/yaml';
import directiveBlock from '@wernerglinka/marked-directive-block';
import imageWithClass from '@wernerglinka/marked-image-with-class';
import linkWithClass from '@wernerglinka/marked-link-with-class';
import paragraphWithClass from '@wernerglinka/marked-paragraph-with-class';
import { Marked } from 'marked';
import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

/**
 * Maps language aliases to their Shiki grammar name and display label.
 * Allows users to write ```nunjucks while using the jinja grammar
 * which includes full template tag tokenization.
 */
const langAliases = {
  nunjucks: { grammar: 'jinja-html', label: 'nunjucks' },
  njk: { grammar: 'jinja-html', label: 'nunjucks' },
};

/**
 * Creates a configured mdToHTML filter with the specified Shiki theme.
 * The theme is loaded dynamically from @shikijs/themes so any bundled
 * Shiki theme name can be used in metalsmith-components.config.json.
 *
 * @param {Object} shikiConfig - Shiki configuration from metalsmith-components.config.json
 * @param {string} shikiConfig.theme - Shiki theme identifier (e.g. 'github-light', 'one-dark-pro')
 * @param {string} [shikiConfig['theme-color']='light'] - 'dark' or 'light', controls label text color
 * @returns {Promise<Function>} mdToHTML filter function
 */
const createMarkdownFilter = async (shikiConfig) => {
  const themeName = shikiConfig.theme;
  const themeColor = shikiConfig['theme-color'] || 'light';
  const themeModule = await import(`@shikijs/themes/${themeName}`);
  const theme = themeModule.default;

  const highlighter = createHighlighterCoreSync({
    themes: [theme],
    langs: [javascript, typescript, css, html, bash, json, yaml, markdown, ...jinja],
    engine: createJavaScriptRegexEngine(),
  });

  const markedInstance = new Marked();

  const renderer = {
    code({ text, lang }) {
      const alias = langAliases[lang];
      const grammar = alias ? alias.grammar : lang || 'text';
      const label = alias ? alias.label : lang || 'text';

      try {
        const highlighted = highlighter.codeToHtml(text, {
          lang: grammar,
          theme: themeName,
        });
        return `<div class="code-block"><span class="code-lang ${themeColor}">${label}</span>${highlighted}</div>`;
      } catch {
        return `<div class="code-block"><span class="code-lang ${themeColor}">${label}</span><pre><code>${text}</code></pre></div>`;
      }
    },

    table({ header, align, rows }) {
      const alignAttr = (i) => (align[i] ? ` style="text-align:${align[i]}"` : '');

      const headerCells = header
        .map((cell, i) => `<th${alignAttr(i)}>${this.parser.parseInline(cell.tokens)}</th>`)
        .join('');

      const bodyRows = rows
        .map((row) => {
          const cells = row
            .map((cell, i) => `<td${alignAttr(i)}>${this.parser.parseInline(cell.tokens)}</td>`)
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');

      return `<div class="table-mask"><div class="table-scroll"><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div></div>`;
    },
  };

  markedInstance.use({ renderer });

  markedInstance.use({
    extensions: [paragraphWithClass(), imageWithClass(), linkWithClass(), directiveBlock()],
  });

  /**
   * Converts markdown string to HTML with syntax highlighting
   * @param {string} mdString - The markdown string to convert
   * @returns {string} The HTML output
   */
  const mdToHTML = (mdString) => {
    try {
      return markedInstance.parse(mdString, {
        mangle: false,
        headerIds: false,
      });
    } catch (e) {
      console.error('Error parsing markdown:', e);
      return mdString;
    }
  };

  return mdToHTML;
};

export default createMarkdownFilter;

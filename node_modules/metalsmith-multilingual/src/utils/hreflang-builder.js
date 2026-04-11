import path from 'node:path';

/**
 * Converts a Metalsmith file path to a URL path.
 *
 * Strips file extensions, converts 'index' files to directory URLs,
 * and ensures leading/trailing slashes.
 *
 * @param {string} filepath - Metalsmith file path (e.g. 'de/werke/2026.03.002.md')
 * @returns {string} URL path (e.g. '/de/werke/2026.03.002/')
 */
function filepathToUrl(filepath) {
  const normalized = filepath.replace(/\\/g, '/');
  const ext = path.extname(normalized);
  const withoutExt = ext ? normalized.slice(0, -ext.length) : normalized;

  if (withoutExt === 'index' || withoutExt === '') {
    return '/';
  }

  if (withoutExt.endsWith('/index')) {
    return `/${withoutExt.slice(0, -'/index'.length)}/`;
  }

  return `/${withoutExt}/`;
}

/**
 * Builds an array of hreflang link objects for a file.
 *
 * Includes the self entry, all alternate language entries from frontmatter,
 * and an x-default entry pointing to the default locale URL when alternates exist.
 *
 * @param {Object|undefined} alternateData - Map of locale codes to URLs from frontmatter
 * @param {string} selfLocale - The locale of the current file
 * @param {string} selfUrl - The URL of the current file
 * @param {string} defaultLocale - The site's default locale code
 * @returns {Array<{lang: string, url: string}>} Array of hreflang link objects
 */
function buildHreflang(alternateData, selfLocale, selfUrl, defaultLocale) {
  const self = { lang: selfLocale, url: selfUrl };

  if (!alternateData || typeof alternateData !== 'object') {
    return [self];
  }

  const alternateEntries = Object.entries(alternateData);

  if (alternateEntries.length === 0) {
    return [self];
  }

  const alternates = alternateEntries.map(([lang, url]) => ({ lang, url }));
  const allEntries = [self, ...alternates];

  const defaultEntry = allEntries.find((entry) => entry.lang === defaultLocale);
  const xDefault = { lang: 'x-default', url: defaultEntry ? defaultEntry.url : selfUrl };

  return [...allEntries, xDefault];
}

export { filepathToUrl, buildHreflang };

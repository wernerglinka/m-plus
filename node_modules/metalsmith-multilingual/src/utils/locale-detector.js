/**
 * Compiles a path pattern into a regular expression for locale detection.
 *
 * Converts a pattern like '{locale}/**' with locales ['en', 'de']
 * into a regex that matches locale prefixes in file paths.
 *
 * @param {string} pathPattern - Pattern containing {locale} placeholder
 * @param {string[]} locales - Array of supported locale codes
 * @returns {RegExp} Compiled regex with a capture group for the locale
 */
function compilePathPattern(pathPattern, locales) {
  const escaped = locales.map((locale) => locale.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const localeGroup = `(${escaped.join('|')})`;
  const regexStr = pathPattern.replace('{locale}', localeGroup).replace('**', '.*').replace('*', '[^/]*');

  return new RegExp(`^${regexStr}`);
}

/**
 * Detects the locale of a file based on its path.
 *
 * @param {string} filepath - The file path to check
 * @param {RegExp} compiledPattern - Pre-compiled regex from compilePathPattern
 * @param {string} defaultLocale - Fallback locale when no match is found
 * @returns {string} The detected locale code
 */
function detectLocale(filepath, compiledPattern, defaultLocale) {
  const normalized = filepath.replace(/\\/g, '/');
  const match = normalized.match(compiledPattern);

  if (match && match[1]) {
    return match[1];
  }

  return defaultLocale;
}

export { compilePathPattern, detectLocale };

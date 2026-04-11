/**
 * Reads a value from a nested object using dot notation.
 *
 * @param {Object} obj - The object to read from
 * @param {string} path - Dot-separated path (e.g. 'seo.alternate')
 * @returns {*} The value at the path, or undefined if not found
 */
function getByDotPath(obj, path) {
  if (!obj || typeof path !== 'string' || path.length === 0) {
    return undefined;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

export { getByDotPath };

/**
 * Deep merges two objects. Values from source override target.
 * Arrays are replaced, not concatenated.
 *
 * @param {Object} target - Base object
 * @param {Object} source - Object with overriding values
 * @returns {Object} Merged object
 */
const deepMerge = (target, source) => {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
};

export default deepMerge;

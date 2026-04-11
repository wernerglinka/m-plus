import * as fs from 'node:fs';
import path from 'node:path';

/**
 * Recursively reads JSON files from a directory into a nested object.
 * Files become keys (without .json extension), subdirectories become nested objects.
 *
 * @param {string} dirPath - Absolute path to the directory to process
 * @returns {Object} Nested object with parsed JSON data
 *
 * @example
 * // Given: lib/data/site.json, lib/data/maps/london.json
 * // Returns: { site: {...}, maps: { london: {...} } }
 */
const processDirectory = (dirPath) => {
  const dirFiles = fs.readdirSync(dirPath);
  const result = {};

  for (const file of dirFiles) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      result[file] = processDirectory(filePath);
    } else if (file.endsWith('.json')) {
      const fileName = file.replace('.json', '');
      const fileContents = fs.readFileSync(filePath, 'utf8');
      result[fileName] = JSON.parse(fileContents);
    }
  }

  return result;
};

/**
 * Creates a Metalsmith plugin that loads JSON data files into metadata.
 * Reads recursively from the configured data directory and makes the data
 * available as `metadata.data` in templates.
 *
 * @param {Object} options
 * @param {string} options.directory - Path to the data directory, relative to the Metalsmith directory
 * @returns {Function} Metalsmith plugin function
 */
const dataLoader = ({ directory }) => {
  return (_files, metalsmith, done) => {
    const dataDir = path.join(metalsmith.directory(), directory);

    if (!fs.existsSync(dataDir)) {
      done();
      return;
    }

    metalsmith.metadata().data = processDirectory(dataDir);
    done();
  };
};

export default dataLoader;

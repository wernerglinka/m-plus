import * as fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import createPipeline from './lib/create-pipeline.js';
import deepMerge from './lib/deep-merge.js';
import defaults from './lib/defaults.js';
import createDevServer from './lib/dev-server.js';

/**
 * Creates a configured site builder from a project directory.
 *
 * Reads metalsmith-components.config.json from the project root, merges it
 * with defaults and any provided overrides, then returns build() and watch()
 * methods that assemble and run the full Metalsmith pipeline.
 *
 * The config file is named metalsmith-components.config.json for backward
 * compatibility with component install scripts from nunjucks-components.com.
 *
 * @param {string} directory - Absolute path to the site project root
 * @param {Object} [overrides={}] - Optional config overrides applied on top of the config file
 * @returns {Object} Site builder with build(), watch(), and metalsmith properties
 *
 * @example
 * import createSite from 'm-plus';
 * const site = createSite( import.meta.dirname );
 * await site.build();
 *
 * @example
 * import createSite from 'm-plus';
 * const site = createSite( import.meta.dirname, {
 *   links: { hostnames: ['http://localhost:3000/', 'https://mysite.com/'] }
 * });
 * await site.watch();
 */
const createSite = (directory, overrides = {}) => {
  /**
   * Read metalsmith-components.config.json from the project root.
   * This filename is required by component install scripts from
   * nunjucks-components.com, so it serves as the single config file.
   */
  const configPath = path.join(directory, 'metalsmith-components.config.json');
  let fileConfig = {};

  if (fs.existsSync(configPath)) {
    fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  const config = deepMerge(deepMerge(defaults, fileConfig), overrides);

  const basePath = process.env.BASE_PATH || '';

  /**
   * Builds the site for production.
   * Assembles the full plugin pipeline including optimization plugins,
   * runs the build, and resolves when complete.
   *
   * @returns {Promise<void>}
   */
  const build = async () => {
    const isProduction = true;
    const metalsmith = await createPipeline(directory, config, { isProduction, basePath });

    const t1 = performance.now();

    return new Promise((resolve, reject) => {
      metalsmith.build((err) => {
        if (err) {
          reject(err);
          return;
        }

        /* eslint-disable no-console */
        console.log(`Build success in ${((performance.now() - t1) / 1000).toFixed(1)}s`);
        resolve();
      });
    });
  };

  /**
   * Builds the site in development mode with watch and live-reload.
   * Starts a BrowserSync server and rebuilds on file changes.
   *
   * @param {Object} [serverOptions={}] - Optional BrowserSync overrides (port, host)
   * @returns {Promise<void>}
   */
  const watch = async (serverOptions = {}) => {
    const isProduction = false;
    const metalsmith = await createPipeline(directory, config, { isProduction, basePath });

    const devServer = createDevServer({
      host: serverOptions.host || config.devServer.host,
      port: serverOptions.port || config.devServer.port,
      basePath,
      buildDir: config.destination,
    });

    let t1 = performance.now();

    return new Promise((resolve, reject) => {
      metalsmith.build((err) => {
        if (err) {
          reject(err);
          return;
        }

        /* eslint-disable no-console */
        console.log(`Build success in ${((performance.now() - t1) / 1000).toFixed(1)}s`);

        if (metalsmith.watch()) {
          t1 = performance.now();
          devServer.reload();
        }

        resolve();
      });
    });
  };

  return { build, watch };
};

export default createSite;

import * as fs from 'node:fs';
import path from 'node:path';

import collections from '@metalsmith/collections';
import drafts from '@metalsmith/drafts';
import layouts from '@metalsmith/layouts';
import permalinks from '@metalsmith/permalinks';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import Metalsmith from 'metalsmith';
import componentDependencyBundler from 'metalsmith-bundled-components';
import menus from 'metalsmith-menu-plus';
import multilingual from 'metalsmith-multilingual';
import htmlMinifier from 'metalsmith-optimize-html';
import optimizeImages from 'metalsmith-optimize-images';
import safeLinks from 'metalsmith-safe-links';
import search from 'metalsmith-search';
import paginatePages from 'metalsmith-sectioned-blog-pagination';
import seo from 'metalsmith-seo';
import assets from 'metalsmith-static-files';
import postcssImport from 'postcss-import';
import stylelint from 'stylelint';
import * as builtinFilters from './nunjucks-filters/index.js';
import dataLoader from './plugins/data-loader.js';

/**
 * Assembles a fully configured Metalsmith instance from a merged config object.
 * Plugins are wired up in the correct order. Optional plugins (collections,
 * pagination, search) are only added when their config keys are present.
 *
 * @param {string} directory - Absolute path to the site project root
 * @param {Object} config - Merged configuration (defaults + metalsmith-components.config.json + overrides)
 * @param {Object} options
 * @param {boolean} options.isProduction - Whether this is a production build
 * @param {string} options.basePath - Subdirectory base path (from BASE_PATH env var)
 * @returns {Metalsmith} Configured Metalsmith instance
 */
const createPipeline = async (directory, config, { isProduction, basePath }) => {
  /**
   * Load site-specific Nunjucks filters if they exist.
   * These are merged on top of the built-in filters, allowing sites
   * to add custom filters without maintaining the full base set.
   */
  let siteFilters = {};
  const siteFiltersPath = path.join(directory, 'nunjucks-filters', 'index.js');

  if (fs.existsSync(siteFiltersPath)) {
    siteFilters = await import(siteFiltersPath);
  }

  const mdToHTML = await builtinFilters.createMarkdownFilter(config.shiki);

  const allFilters = { ...builtinFilters, mdToHTML, ...siteFilters };

  const engineOptions = {
    path: [config.layouts.directory],
    filters: allFilters,
  };

  /**
   * Read package.json for version metadata passed to templates
   */
  let dependencies = {};
  const packageJsonPath = path.join(directory, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    dependencies = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).dependencies || {};
  }

  /**
   * Create and configure the Metalsmith instance
   */
  const metalsmith = Metalsmith(directory);

  if (process.env.DEBUG) {
    metalsmith.env('DEBUG', process.env.DEBUG);
  }

  metalsmith
    .clean(true)
    .ignore(['**/.DS_Store'])
    .watch(isProduction ? false : config.watch.paths)
    .env('NODE_ENV', process.env.NODE_ENV)
    .source(config.source)
    .destination(config.destination)
    .metadata({
      msVersion: dependencies.metalsmith || dependencies['m-plus'] || '',
      nodeVersion: process.version,
    })

    // 1. Load data files into metadata
    .use(dataLoader({ directory: config.data.directory }));

  /**
   * 2. Multilingual — only when configured
   * Detects locale from file paths, builds hreflang metadata from
   * frontmatter cross-references between language versions.
   */
  if (config.multilingual) {
    metalsmith.use(multilingual(config.multilingual));
  }

  // 3. Exclude drafts in production
  metalsmith.use(drafts(!isProduction));

  /**
   * 3. Collections — only when configured
   * Groups content files into named collections (e.g., blog posts)
   */
  if (config.collections) {
    metalsmith.use(collections(config.collections));
  }

  /**
   * 4. Pagination — only when configured
   * Generates pagination metadata for sectioned blog pages.
   * Accepts a single object or an array of objects to paginate
   * multiple listing pages independently.
   */
  if (config.pagination) {
    const paginationConfigs = Array.isArray(config.pagination)
      ? config.pagination
      : [config.pagination];
    for (const paginationConfig of paginationConfigs) {
      metalsmith.use(paginatePages(paginationConfig));
    }
  }

  /**
   * 5a. Slug extraction — when linksets are configured
   * Extracts the filename (without extension) as a slug property for use
   * in permalink patterns. This enables year-organized files (writing/2026/post.md)
   * to produce flat URLs (/writing/post/).
   */
  if (config.permalinks.linksets) {
    metalsmith.use((files) => {
      for (const file of Object.keys(files)) {
        if (file.endsWith('.md')) {
          const segments = file.split('/');
          const filename = segments[segments.length - 1];
          files[file].slug = filename.replace(/\.md$/, '');
        }
      }
    });
  }

  /**
   * 5b. Permalinks — always active
   * Creates clean URLs. When config.permalinks.linksets is defined, passes
   * linksets through to the plugin for flat URL generation from nested directories.
   */
  metalsmith.use(
    permalinks({
      match: config.permalinks.match,
      ...(config.permalinks.linksets ? { linksets: config.permalinks.linksets } : {}),
    })
  );

  /**
   * 6. Navigation menus
   * Supports a single menu config (object) or multiple menus (array).
   * Each entry produces an independent navigation tree in metadata under its
   * own metadataKey (e.g., 'mainMenu', 'artMenu').
   */
  const menuConfigs = Array.isArray(config.menus) ? config.menus : [config.menus];
  for (const menuConfig of menuConfigs) {
    metalsmith.use(
      menus({
        metadataKey: menuConfig.metadataKey,
        usePermalinks: menuConfig.usePermalinks,
        navExcludePatterns: menuConfig.exclude,
        ...(menuConfig.rootPath ? { rootPath: menuConfig.rootPath } : {}),
      })
    );
  }

  /**
   * 7. Layouts — apply Nunjucks templates
   */
  metalsmith.use(
    layouts({
      directory: config.layouts.directory,
      transform: config.layouts.transform,
      pattern: config.layouts.pattern,
      engineOptions,
    })
  );

  /**
   * 8. Search — only when configured
   */
  if (config.search) {
    metalsmith.use(search(config.search));
  }

  /**
   * 9. Safe links — external link attributes, relative internal links
   */
  metalsmith.use(
    safeLinks({
      hostnames: config.links.hostnames,
      basePath: basePath,
    })
  );

  /**
   * 10. Component dependency bundler — CSS + JS via esbuild with PostCSS
   * Uses the flat keys (componentsBasePath, sectionsDir, partialsDir) that
   * match the original metalsmith-components.config.json format expected
   * by component install scripts.
   */
  const partialsPath = `${config.componentsBasePath}/${config.partialsDir}`;
  const sectionsPath = `${config.componentsBasePath}/${config.sectionsDir}`;

  metalsmith.use(
    componentDependencyBundler({
      basePath: partialsPath,
      sectionsPath: sectionsPath,
      layoutsPath: config.bundler.layoutsPath,
      mainCSSEntry: config.css.entry,
      mainJSEntry: config.js.entry,
      cssDest: config.css.output,
      jsDest: config.js.output,
      minifyOutput: isProduction,
      validation: config.bundler.validation,
      postcss: {
        enabled: true,
        plugins: [
          stylelint(),
          postcssImport({
            path: [
              path.dirname(config.css.entry),
              path.join(path.dirname(config.css.entry), 'styles'),
            ],
          }),
          autoprefixer(),
          cssnano({ preset: 'default' }),
        ],
        options: {},
      },
    })
  );

  /**
   * 11. Static assets — copy without processing
   */
  metalsmith.use(
    assets({
      source: config.staticFiles.source,
      destination: config.staticFiles.destination,
      ignore: config.staticFiles.ignore,
    })
  );

  /**
   * Production-only plugins
   */
  if (isProduction) {
    metalsmith
      .use(optimizeImages(config.optimizeImages))
      .use(
        seo({
          metadataPath: config.seo.metadataPath,
          omitIndex: config.seo.omitIndex,
        })
      )
      .use(htmlMinifier(config.optimizeHtml));
  }

  return metalsmith;
};

export default createPipeline;

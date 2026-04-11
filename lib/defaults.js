/**
 * Default configuration values for m-plus.
 * These match the conventions established by the microStarter project.
 * Site projects override these via metalsmith-components.config.json.
 *
 * The top-level component path keys (componentsBasePath, sectionsDir,
 * partialsDir) use the same names expected by component install scripts
 * from nunjucks-components.com, ensuring backward compatibility.
 */
const defaults = {
  source: './src',
  destination: './build',

  componentsBasePath: 'lib/layouts/components',
  sectionsDir: 'sections',
  partialsDir: '_partials',

  layouts: {
    directory: 'lib/layouts',
    pattern: ['**/*.html'],
    transform: 'nunjucks',
  },

  css: {
    entry: 'lib/assets/main.css',
    output: 'assets/main.css',
  },

  js: {
    entry: 'lib/assets/main.js',
    output: 'assets/main.js',
  },

  data: {
    directory: 'lib/data',
  },

  permalinks: {
    match: '**/*.md',
  },

  links: {
    hostnames: ['http://localhost:3000/'],
  },

  menus: {
    metadataKey: 'mainMenu',
    usePermalinks: true,
    exclude: ['index.html', '404.html', 'robots.txt'],
  },

  seo: {
    metadataPath: 'data.site',
    omitIndex: true,
  },

  staticFiles: {
    source: 'lib/assets/',
    destination: 'assets/',
    ignore: ['main.css', 'main.js', 'styles/'],
  },

  optimizeImages: {
    isProgressive: false,
  },

  optimizeHtml: {},

  bundler: {
    layoutsPath: 'lib/layouts',
    validation: {
      enabled: true,
      strict: false,
      reportAllErrors: true,
    },
  },

  multilingual: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    pathPattern: '{locale}/**',
    alternateKey: 'seo.alternate',
    localeLabels: { en: 'English', de: 'Deutsch' },
  },

  watch: {
    paths: [
      'src/**/*',
      'lib/layouts/**/*',
      'lib/assets/main.css',
      'lib/assets/main.js',
      'lib/assets/styles/**/*',
      'lib/data/**/*',
    ],
  },

  shiki: {
    theme: 'github-light',
    'theme-color': 'light',
  },

  devServer: {
    host: 'localhost',
    port: 3000,
  },
};

export default defaults;

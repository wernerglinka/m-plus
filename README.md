# m-plus

An opinionated [Metalsmith](https://metalsmith.io/) build wrapper that packages a complete static site pipeline into a single dependency.

Metalsmith's flexibility is valuable when you're deciding what goes into your build pipeline. But once those choices are made — and after years of building sites, the same plugins, the same directory structure, the same configuration patterns keep showing up — that flexibility becomes overhead. Every new project copies the same 300-line `metalsmith.js`, the same 15+ plugin dependencies, the same wiring.

m-plus captures those settled decisions in one package. Sites install it, call `createSite()`, and get the full pipeline without re-making choices that were already made long ago.

It also serves as the engine behind a conversational website building workflow where non-technical users update static sites by talking to Claude. By separating build complexity from site content, an AI only needs to produce structured YAML data, never touch build plumbing.

## Before and After

Without m-plus, each site manages its own plugin wiring — explicit calls to 15+ plugins, each with embedded configuration, scattered across a 300-line build file.

With m-plus, that becomes:

```javascript
import createSite from 'm-plus';

const site = createSite(import.meta.dirname);

if (process.argv.includes('--watch')) {
  await site.watch();
} else {
  await site.build();
}
```

All configuration lives in `metalsmith-components.config.json`. The build file is boilerplate.

## Requirements

- Node.js >= 22.0.0
- Several plugins are linked via `file:` paths to a local `metalsmith/plugins/` directory (see [Custom Plugins](#custom-plugins) below)

## Installation

m-plus is consumed as a local dependency via `file:` path from sibling projects:

```json
{
  "dependencies": {
    "m-plus": "file:../m-plus"
  }
}
```

There is no build step. It is used directly as an ES module.

## API

### `createSite(directory, overrides?)`

Creates a configured site builder from a project directory.

- **`directory`** — Absolute path to the site project root. Use `import.meta.dirname` from the site's entry point.
- **`overrides`** — Optional config object applied on top of `metalsmith-components.config.json`. Useful for programmatic overrides that don't belong in a config file.

Returns an object with two methods:

#### `site.build()`

Assembles the full plugin pipeline including production-only plugins (image optimization, SEO, HTML minification), runs the build, and resolves when complete. Returns a `Promise<void>`.

#### `site.watch(serverOptions?)`

Assembles the development pipeline (no optimization plugins), runs the build with file watching enabled, and starts a BrowserSync dev server with live reload. Accepts optional `{ host, port }` overrides. Returns a `Promise<void>`.

### Nunjucks Filters Export

The built-in filter library is available as a secondary export:

```javascript
import * as filters from 'm-plus/filters';
```

## Configuration

m-plus uses a three-layer configuration system. Each layer deep-merges onto the previous one (objects are merged recursively, arrays are replaced):

1. **Built-in defaults** (`lib/defaults.js`) — sensible values matching established conventions
2. **Site config file** (`metalsmith-components.config.json` in the project root) — site-specific overrides
3. **Programmatic overrides** (second argument to `createSite()`) — runtime overrides

Sites following standard conventions often need minimal configuration. The config file is named `metalsmith-components.config.json` (not `metalsmith.config.json`) for backward compatibility with component install scripts from [metalsmith-components.com](https://metalsmith-components.com).

### Default Configuration

```javascript
{
  source: './src',
  destination: './build',

  componentsBasePath: 'lib/layouts/components',
  sectionsDir: 'sections',
  partialsDir: '_partials',

  layouts: {
    directory: 'lib/layouts',
    pattern: ['**/*.html'],
    transform: 'nunjucks'
  },

  css: { entry: 'lib/assets/main.css', output: 'assets/main.css' },
  js: { entry: 'lib/assets/main.js', output: 'assets/main.js' },
  data: { directory: 'lib/data' },

  permalinks: { match: '**/*.md' },
  links: { hostnames: ['http://localhost:3000/'] },

  menus: {
    metadataKey: 'mainMenu',
    usePermalinks: true,
    exclude: ['index.html', '404.html', 'robots.txt']
  },

  seo: { metadataPath: 'data.site', omitIndex: true },
  staticFiles: { source: 'lib/assets/', destination: 'assets/', ignore: ['main.css', 'main.js', 'styles/'] },
  optimizeImages: { isProgressive: false },

  multilingual: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    pathPattern: '{locale}/**',
    alternateKey: 'seo.alternate',
    localeLabels: { en: 'English', de: 'Deutsch' }
  },

  watch: { paths: ['src/**/*', 'lib/layouts/**/*', 'lib/assets/main.css', 'lib/assets/main.js', 'lib/assets/styles/**/*', 'lib/data/**/*'] },
  shiki: { theme: 'github-light', 'theme-color': 'light' },
  devServer: { host: 'localhost', port: 3000 }
}
```

Every value can be overridden from `metalsmith-components.config.json`. Optional features — `collections`, `pagination`, `search` — are only activated when their config keys are present; they have no defaults.

### Example Site Config

```json
{
  "componentsBasePath": "lib/layouts/components",
  "sectionsDir": "sections",
  "partialsDir": "_partials",

  "collections": {
    "writing": { "pattern": "writing/**/*.md", "sortBy": "date", "reverse": true }
  },
  "pagination": {
    "postsPerPage": 10,
    "collection": "writing",
    "template": "writing-main.njk"
  },
  "permalinks": {
    "match": "**/*.md",
    "linksets": [
      { "match": { "collection": "writing" }, "pattern": "writing/:slug" }
    ]
  },
  "shiki": { "theme": "material-theme-palenight", "theme-color": "dark" }
}
```

## Plugin Pipeline

m-plus assembles plugins in a fixed, order-dependent sequence. Each plugin transforms the file tree for the next. Optional plugins are only added when their config key is present.

| Order | Plugin | Purpose | Optional |
|-------|--------|---------|----------|
| 1 | data-loader | Recursively loads JSON from `lib/data/` into `metadata.data` | |
| 2 | multilingual | Locale detection and hreflang metadata | Yes |
| 3 | drafts | Excludes draft pages in production | |
| 4 | collections | Groups files into named collections | Yes |
| 5 | pagination | Generates pagination for sectioned blog pages | Yes |
| 6 | slug extraction | Sets `file.slug` from filename (for flat URLs from nested dirs) | Yes |
| 7 | permalinks | Creates clean URLs | |
| 8 | menus | Builds navigation menu metadata | |
| 9 | layouts | Applies Nunjucks templates | |
| 10 | search | Builds search index | Yes |
| 11 | safe-links | External link attributes, relative internal links | |
| 12 | component-bundler | Resolves dependency tree, bundles CSS/JS via esbuild + PostCSS | |
| 13 | static-assets | Copies unprocessed files | |

**Production only** (appended after static-assets):
- **optimize-images** — image compression
- **seo** — generates sitemap.xml, robots.txt, and meta tags
- **optimize-html** — HTML minification

## Sectioned Pages

Pages use no Markdown body content. All content is defined as a `sections` array in YAML frontmatter. Each section's `sectionType` maps to a component folder under `lib/layouts/components/sections/`.

```yaml
---
layout: blocks.njk
sections:
  - sectionType: hero
    title: Welcome
    prose: "This is **markdown** rendered at template time."
  - sectionType: text-only
    title: About
    prose: "More content here."
---
```

When markdown appears inside section properties (a heading, a paragraph of prose), it is converted to HTML at template render time through the `mdToHTML` Nunjucks filter. No markdown processing plugins run in the pipeline — this architectural choice eliminates several plugin dependencies and keeps the content model simple.

## Component System

Each component lives in its own folder with a standard structure:

```
lib/layouts/components/sections/hero/
  component.njk      # Nunjucks template
  manifest.json      # Declares dependencies, styles, scripts
  component.css      # Optional styles
  component.js       # Optional scripts
```

The manifest declares dependencies via a `requires` array. The component bundler reads manifests from each section used on a page, resolves the full dependency tree, and bundles only the required CSS and JS via esbuild with PostCSS.

Two component types:
- **Sections** (`sections/`) — page-level blocks
- **Partials** (`_partials/`) — reusable elements included by sections

The authoritative source for available components, configuration options, and installation guides is [metalsmith-components.com](https://metalsmith-components.com).

## Nunjucks Filters

m-plus ships 33 built-in filters across seven categories:

**String** — `toLower`, `toUpper`, `spaceToDash`, `condenseTitle`, `trimSlashes`, `trimString`

**Date** — `currentYear`, `UTCdate`, `blogDate`, `getDate`, `getMonthYear`

**Markdown** — `mdToHTML` (created at build time via `createMarkdownFilter()` with configurable Shiki theme; converts markdown to HTML with syntax highlighting, zero client-side JavaScript)

**Array** — `getSelections`, `toArray`, `getArrayLength`, `isArray`, `isRelated`

**Debug** — `objToString`, `myDump`, `safeDump`, `debugCollections`

**Validation** — `isExternal`, `isString`, `hasImage`, `hasCtas`, `hasText`, `hasAuthor`, `hasUrl`, `hasItems`, `hasIcon`

**Object** — `normalizeIcon`, `mergeProps`, `merge`

### Custom Filters

Sites can add or override filters by creating `nunjucks-filters/index.js` in the project root. Site filters are merged on top of built-ins — any filter with the same name replaces the built-in version.

## Custom Plugins

Several plugins are linked via `file:` paths pointing to a local `metalsmith/plugins/` directory outside this repo:

- metalsmith-bundled-components
- metalsmith-menu-plus
- metalsmith-multilingual
- metalsmith-optimize-html
- metalsmith-optimize-images
- metalsmith-safe-links
- metalsmith-search
- metalsmith-sectioned-blog-pagination
- metalsmith-seo

If these paths are not present on the machine, `npm install` will fail. Adjust the `file:` paths in `package.json` to match your local plugin locations.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | Passed to Metalsmith; controls draft inclusion |
| `BASE_PATH` | Subdirectory base path for subdomain deployments; threaded to safe-links and dev server |
| `DEBUG` | Enables Metalsmith debug logging (e.g., `DEBUG=@metalsmith*`) |

## Development

### Scripts

```shell
npm test           # Run all tests (Node built-in test runner)
npm run format     # Format with Biome
npm run lint       # Lint with Biome
npm run check      # Format + lint with Biome
```

### Project Structure

```
index.js                          # Entry point, exports createSite()
lib/
  deep-merge.js                   # Recursive object merge utility
  defaults.js                     # Default configuration values
  create-pipeline.js              # Plugin pipeline assembly
  dev-server.js                   # BrowserSync wrapper
  plugins/
    data-loader.js                # Recursive JSON loader plugin
  nunjucks-filters/
    index.js                      # Re-exports all filters
    string-filters.js             # String manipulation (6 filters)
    date-filters.js               # Date formatting (5 filters)
    markdown-filter.js            # Markdown-to-HTML with Shiki (factory)
    array-filters.js              # Array manipulation (5 filters)
    debug-filters.js              # Debug and JSON formatting (4 filters)
    validation-filters.js         # Validation checks (9 filters)
    object-filters.js             # Object manipulation (3 filters)
test/
  deep-merge.test.js              # deepMerge utility tests
  string-filters.test.js          # String filter tests
  date-filters.test.js            # Date filter tests
  array-filters.test.js           # Array filter tests
  validation-filters.test.js      # Validation filter tests
  object-filters.test.js          # Object filter tests
  debug-filters.test.js           # Debug filter tests
  data-loader.test.js             # Data loader plugin tests (real Metalsmith)
```

### Testing

Tests use Node 22's built-in test runner (`node:test` and `node:assert`). Plugin tests run against real Metalsmith instances, never mocks.

### Code Style

- JavaScript only (no TypeScript), JSDoc for type annotations
- ES modules throughout (`"type": "module"`)
- Functional programming: pure functions, explicit returns, composition over inheritance
- Biome for linting and formatting

### Known Constraints

- **Metalsmith pinned to 2.6.3.** Version 2.7.0 silently breaks watch mode because chokidar 4 drops glob patterns. Do not upgrade until upstream fixes this.
- **PostCSS pipeline is fixed.** The PostCSS plugin chain (stylelint, postcss-import, autoprefixer, cssnano) is not configurable from site config. This is intentional — it represents the standard build pipeline.

## Deployment

m-plus is designed for a GitHub + Netlify workflow:

1. Source files live in a GitHub repository
2. Netlify watches the repository for pushes to the main branch
3. On push, Netlify runs `npm run build` which invokes m-plus to produce static output
4. The built files are published to Netlify's CDN

Every change is a committed and reversible action. The developer connects GitHub to Netlify during initial setup; from that point on, deployment is automatic.

## License

MIT

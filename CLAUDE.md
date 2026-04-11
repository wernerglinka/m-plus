# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Package Is

m-plus is a build system wrapper that packages Metalsmith and all its plugins into a single dependency. It exports `createSite()` from `index.js`, which consumer projects call with a directory path and optional config overrides. The returned object has `build()` (production) and `watch()` (dev server with live reload) methods.

This package has no build step itself — it is consumed directly as an ES module via `file:../m-plus` from sibling projects like `starter/`.

## Testing and Tooling

Node 22+ is required. Tests use Node's built-in test runner (`node --test`), not Mocha. The `test/` directory exists but is currently empty.

```shell
node --test            # Run all tests
node --test test/foo.test.js  # Run a single test file
```

Biome is used for linting and formatting.

## How the Pipeline Works

`create-pipeline.js` is the core file. It assembles Metalsmith plugins in a fixed, order-dependent sequence. The order matters because each plugin transforms the file tree for the next:

1. **data-loader** — reads JSON files from `lib/data/` into `metadata.data`
2. **multilingual** — (optional) locale detection and hreflang metadata
3. **drafts** — excludes draft pages in production
4. **collections** — (optional) groups files into named collections
5. **pagination** — (optional) generates pagination for sectioned blog pages
6. **slug extraction** — inline plugin that sets `file.slug` from filename when linksets are configured
7. **permalinks** — creates clean URLs (`/page/` instead of `/page.html`)
8. **menus** — builds navigation menu metadata
9. **layouts** — applies Nunjucks templates
10. **search** — (optional) builds search index
11. **safe-links** — adds `target="_blank"` to external links, makes internal links relative
12. **component-bundler** — resolves component dependency tree, bundles CSS/JS via esbuild + PostCSS
13. **static-assets** — copies unprocessed files
14. **Production only:** image optimization, SEO metadata, HTML minification

Plugins marked "(optional)" are only added when their config key exists.

## Configuration Layering

Three layers, deep-merged (arrays replaced, objects merged):

`defaults.js` → `metalsmith-components.config.json` (in consumer project root) → programmatic overrides passed to `createSite()`

The `deepMerge()` function in `index.js` handles this. It is not a library — it is a simple recursive merge that replaces arrays.

## Nunjucks Filters

`lib/nunjucks-filters/` contains 8 modules exporting 30+ filters, re-exported through `index.js`. The package also exports filters at `m-plus/filters` (see `package.json` exports map).

The `mdToHTML` filter is special: it is created at pipeline-build time via `createMarkdownFilter()` because it needs the site's Shiki theme config, which is not available at import time. It gets merged into the filter set in `create-pipeline.js`.

Sites can add custom filters by creating `nunjucks-filters/index.js` in their project root. Site filters are spread on top of built-ins, so they can override any filter by name.

## Custom Plugins (External)

Several plugins are linked via `file:` paths to `../../metalsmith/plugins/` (outside this repo). If these paths break, `npm install` will fail. The external plugins are: metalsmith-bundled-components, metalsmith-menu-plus, metalsmith-optimize-html, metalsmith-optimize-images, metalsmith-safe-links, metalsmith-search, metalsmith-sectioned-blog-pagination, metalsmith-multilingual, metalsmith-seo.

## Key Design Decisions

- **No Markdown body content.** Pages define all content as a `sections` array in YAML frontmatter. The `sectionType` field maps to a component folder. No markdown pipeline plugins are needed — markdown within prose fields is converted at template render time by the `mdToHTML` filter. This eliminates 4+ plugin dependencies.
- **Config file is named `metalsmith-components.config.json`** (not `metalsmith.config.json`) because component install scripts from metalsmith-components.com already understand this file. Build configuration keys were added alongside existing component path keys rather than introducing a second config file.
- **`BASE_PATH` env var** supports subdirectory deployments. It is read in `index.js` and threaded through to safe-links and the dev server.
- **Component paths use flat config keys** (`componentsBasePath`, `sectionsDir`, `partialsDir`) matching the format expected by component install scripts, not nested objects.
- **Metalsmith pinned to 2.6.3.** Version 2.7.0 silently breaks watch mode because chokidar 4 drops glob patterns. Do not upgrade until upstream fixes this.
- **Shiki for syntax highlighting** (replaced Prism.js). Uses `createHighlighterCoreSync` — no async initialization, zero client-side JavaScript. Theme is configurable via `config.shiki` and loaded at build time.

## Project Vision

This wrapper exists so that non-technical users can update static websites through conversation with Claude. The architecture separates build complexity (m-plus) from site content (starter projects) so that Claude only needs to produce structured YAML data, never modify build plumbing. A site's `metalsmith.js` is reduced from 300+ lines of plugin wiring to 6 lines calling `createSite()`.

Claude's operational boundary when helping users: it changes content, data, and installs components — it does NOT modify build config, update packages, or edit templates in `lib/layouts/`. See `docs/update-mode-skill.md` for the full update-mode guidance.

## Design Documents

The `docs/` folder at the workspace root contains architecture and design rationale:

- `chronicle.md` — comprehensive design journey from problem analysis to working wrapper
- `initial-analysis.md` — analysis of three reference projects that informed the design (reveals which installed dependencies are actually unused)
- `m-plus-build-plan.md` — strategic plan and API design before implementation
- `setup-architecture.md` — full architecture for conversational site updates
- `update-mode-skill.md` — Claude's operational boundaries when helping users update sites
- `current-state.md` — recent changes and fixes (Shiki migration, Metalsmith pinning, marked extensions)

# metalsmith-safe-links

Metalsmith plugin to process all URLs in HTML documents for sites that need subdirectory deployment support. Handles both absolute and relative URLs across all HTML elements and inline CSS styles.

**URL Processing:**
- **Absolute URLs with matching hostnames** → Strips `<protocol://hostname>`, adds base path
- **Relative URLs starting with `/`** → Adds base path (e.g., `/page/` → `/my-app/page/`)
- **External URLs (anchors only)** → Adds _target_ and _rel_ attributes
- **Path-relative URLs** (e.g., `./`, `../`) → Left unchanged

**Processes URLs in all relevant HTML elements:**
- `<a href>` - Links (also gets target/rel for external)
- `<link href>` - Stylesheets, favicons, etc.
- `<script src>` - JavaScript files
- `<img src>` - Images
- `<iframe src>` - Embedded frames
- `<source src>` - Media sources
- `<track src>` - Video/audio tracks
- `<embed src>` - Embedded content
- `<form action>` - Form submission URLs
- `<object data>` - Object data
- `<video poster>` - Video posters
- `<area href>` - Image map areas
- `style` attributes - CSS `url()` functions (e.g., `background-image: url(...)`)

This provides a comprehensive solution for sites deployed in subdirectories, handling all URL references in a single place regardless of whether they're absolute or relative.

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: ISC][license-badge]][license-url]
[![coverage][coverage-badge]][coverage-url]
[![ESM/CommonJS][modules-badge]][npm-url]
[![Known Vulnerabilities](https://snyk.io/test/npm/metalsmith-safe-links/badge.svg)](https://snyk.io/test/npm/metalsmith-safe-links)

## Installation

```
npm i metalsmith-safe-links
```

## Usage

**This plugin must be used after markdown has been transformed into html**

This plugin supports both ESM and CommonJS environments.

### ESM (ECMAScript Modules)

```js
import metalsmith from 'metalsmith';
import markdown from '@metalsmith/markdown';
import layouts from '@metalsmith/layouts';
import metalsmithSafeLinks from 'metalsmith-safe-links';

metalsmith(__dirname)
  .use(markdown())
  .use(layouts())
  .use(
    metalsmithSafeLinks({
      hostnames: ['www.livesite.com', 'stagingsite.com'],
      basePath: 'my-app' // Optional: for sites deployed in subdirectories
    })
  )
  .build();
```

### CommonJS

```js
const metalsmith = require('metalsmith');
const markdown = require('@metalsmith/markdown');
const layouts = require('@metalsmith/layouts');
const metalsmithSafeLinks = require('metalsmith-safe-links');

metalsmith(__dirname)
  .use(markdown())
  .use(layouts())
  .use(
    metalsmithSafeLinks({
      hostnames: ['www.livesite.com', 'stagingsite.com'],
      basePath: 'my-app' // Optional: for sites deployed in subdirectories
    })
  )
  .build();
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `hostnames` | `array` | `[]` | Array of hostnames considered "local". The plugin will strip `<protocol://hostname>` from all links with these hostnames. |
| `basePath` | `string` | `''` | Base path to prepend to local links (e.g., `'my-app'` for sites deployed at `/my-app/`). |

## Examples

### Basic Usage (without basePath)

**Absolute URLs:**
```html
<!-- Input -->
<a href="https://www.livesite.com/page/">Internal Link</a>
<a href="https://external.com/">External Link</a>
<link href="https://www.livesite.com/styles.css" rel="stylesheet">

<!-- Output -->
<a href="/page/">Internal Link</a>
<a href="https://external.com/" target="_blank" rel="noopener noreferrer">External Link</a>
<link href="/styles.css" rel="stylesheet">
```

**Relative URLs (no changes without basePath):**
```html
<!-- Input & Output (unchanged) -->
<a href="/about/">Root-relative Link</a>
<img src="./image.jpg" alt="Path-relative Image">
<script src="../js/app.js"></script>
```

### With Base Path

When using `basePath: 'my-app'`, **all applicable URLs** are transformed:

```html
<!-- Input -->
<link href="https://www.livesite.com/styles.css" rel="stylesheet">
<a href="https://www.livesite.com/page/">Absolute Internal Link</a>
<img src="/images/photo.jpg" alt="Root-relative Image">
<a href="/about/">Root-relative Link</a>
<script src="./local.js"></script>

<!-- Output -->
<link href="/my-app/styles.css" rel="stylesheet">
<a href="/my-app/page/">Absolute Internal Link</a>  
<img src="/my-app/images/photo.jpg" alt="Root-relative Image">
<a href="/my-app/about/">Root-relative Link</a>
<script src="./local.js"></script>  <!-- Path-relative unchanged -->
```

### CSS url() Processing

The plugin also processes URLs within CSS `url()` functions in `style` attributes:

```html
<!-- Input -->
<div style="background-image: url('https://www.livesite.com/bg.jpg')">Local background</div>
<div style="background-image: url('https://external.com/bg.jpg')">External background</div>
<div style="background-image: url('/relative/image.jpg')">Root-relative background</div>
<p style="background: url(https://www.livesite.com/icon.png) no-repeat; color: red;">Complex styles</p>

<!-- Output (with basePath: 'my-app') -->
<div style="background-image: url('/my-app/bg.jpg')">Local background</div>
<div style="background-image: url('https://external.com/bg.jpg')">External background</div>
<div style="background-image: url('/my-app/relative/image.jpg')">Root-relative background</div>
<p style="background: url(/my-app/icon.png) no-repeat; color: red;">Complex styles</p>
```

**CSS Processing Features:**
- Handles single quotes, double quotes, and unquoted URLs
- Preserves original formatting and spacing
- Processes multiple `url()` functions within complex styles
- Skips data URLs and hash references (e.g., `#pattern`)
- Works with any CSS property using `url()` (background-image, border-image, etc.)

**Key behaviors:**
- **Absolute URLs** with matching hostnames → stripped and get base path
- **Root-relative URLs** (`/page/`) → get base path prepended  
- **Path-relative URLs** (`./`, `../`) → unchanged (handled by browser)

This enables sites deployed in subdirectories like `https://example.com/my-app/` to work correctly with all assets and links, regardless of URL format.

## Debug

To enable debug logs, set the DEBUG environment variable to metalsmith-safe-links:

```javascript
metalsmith.env('DEBUG', '@metalsmith/metadata*');
```

## CLI usage

To use this plugin with the Metalsmith CLI, add `metalsmith-safe-links` to the `plugins` key in your `metalsmith.json` file:

```json
{
  "plugins": [
    {
      "metalsmith-safe-links": {
        "hostnames": ["www.livesite.com", "stagingsite.com"],
        "basePath": "my-app"
      }
    }
  ]
}
```

## Authors

[werner@glinka.co](https://github.com/wernerglinka)

## License

Code released under [the ISC license](https://github.com/wernerglinka/metalsmith-safe-links/blob/main/LICENSE).

[npm-badge]: https://img.shields.io/npm/v/metalsmith-safe-links.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-safe-links
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-safe-links
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/test%20coverage-94%25-brightgreen
[coverage-url]: https://github.com/wernerglinka/metalsmith-safe-links/actions/workflows/test.yml
[modules-badge]: https://img.shields.io/badge/modules-ESM%2FCJS-blue

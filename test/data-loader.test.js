import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import Metalsmith from 'metalsmith';

import dataLoader from '../lib/plugins/data-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');
const dataDir = path.join(fixturesDir, 'data');

describe('dataLoader', () => {
  beforeEach(() => {
    fs.mkdirSync(path.join(dataDir, 'nested'), { recursive: true });
    fs.mkdirSync(path.join(fixturesDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'site.json'), JSON.stringify({ title: 'Test Site' }));
    fs.writeFileSync(path.join(dataDir, 'nested', 'page.json'), JSON.stringify({ slug: 'about' }));
    fs.writeFileSync(path.join(dataDir, 'readme.txt'), 'not json');
  });

  afterEach(() => {
    fs.rmSync(fixturesDir, { recursive: true, force: true });
  });

  it('loads JSON files into metadata.data', async () => {
    const metalsmith = Metalsmith(fixturesDir)
      .source('src')
      .destination('build')
      .clean(false)
      .use(dataLoader({ directory: 'data' }));

    await metalsmith.process();
    assert.deepStrictEqual(metalsmith.metadata().data.site, { title: 'Test Site' });
  });

  it('loads nested directories as nested objects', async () => {
    const metalsmith = Metalsmith(fixturesDir)
      .source('src')
      .destination('build')
      .clean(false)
      .use(dataLoader({ directory: 'data' }));

    await metalsmith.process();
    assert.deepStrictEqual(metalsmith.metadata().data.nested.page, { slug: 'about' });
  });

  it('ignores non-JSON files', async () => {
    const metalsmith = Metalsmith(fixturesDir)
      .source('src')
      .destination('build')
      .clean(false)
      .use(dataLoader({ directory: 'data' }));

    await metalsmith.process();
    assert.equal(metalsmith.metadata().data.readme, undefined);
  });

  it('completes without error when directory does not exist', async () => {
    const metalsmith = Metalsmith(fixturesDir)
      .source('src')
      .destination('build')
      .clean(false)
      .use(dataLoader({ directory: 'nonexistent' }));

    await metalsmith.process();
    assert.equal(metalsmith.metadata().data, undefined);
  });
});

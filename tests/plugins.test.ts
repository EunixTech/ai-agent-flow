import path from 'node:path';
import { Runner } from '../src/index';
import { Plugin } from '../src/plugins';

describe('Plugin system', () => {
  it('registers plugin objects', () => {
    const plugin: Plugin = {
      name: 'obj',
      setup(r) {
        (r as any).objLoaded = true;
      },
    };

    const runner = new Runner(1, 10, undefined, [plugin]);
    expect(runner.getPlugins().some((p) => p.name === 'obj')).toBe(true);
    // setup should have run
    expect((runner as any).objLoaded).toBe(true);
  });

  it('loads plugins from file paths', () => {
    const file = path.join(__dirname, 'fixtures', 'example-plugin.js');
    const runner = new Runner(1, 10, undefined, [file]);
    expect(runner.getPlugins().some((p) => p.name === 'example-plugin')).toBe(true);
    expect((runner as any).exampleInitialized).toBe(true);
  });

  it('loads plugins from directories', () => {
    const dir = path.join(__dirname, 'fixtures', 'plugins');
    const runner = new Runner(1, 10, undefined, [dir]);
    expect(runner.getPlugins().some((p) => p.name === 'dir-plugin')).toBe(true);
    expect((runner as any).dirPluginLoaded).toBe(true);
  });
});

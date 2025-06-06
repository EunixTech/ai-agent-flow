export interface Plugin {
  name: string;
  setup(runner: import('../index').Runner): void;
}

import fs from 'fs';
import path from 'path';

export function loadPluginSync(modPath: string): Plugin | undefined {
  const resolved = path.isAbsolute(modPath) ? modPath : path.resolve(process.cwd(), modPath);
  try {
     
    const mod = require(resolved);
    const plugin: Plugin | undefined = mod.default ?? mod.plugin;
    return plugin;
  } catch {
    return undefined;
  }
}

export function loadPluginsFromDirSync(dir: string): Plugin[] {
  const resolvedDir = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
  if (!fs.existsSync(resolvedDir)) return [];
  const files = fs.readdirSync(resolvedDir);
  const plugins: Plugin[] = [];
  for (const file of files) {
    const full = path.join(resolvedDir, file);
    const stat = fs.statSync(full);
    if (stat.isFile()) {
      const plugin = loadPluginSync(full);
      if (plugin) plugins.push(plugin);
    }
  }
  return plugins;
}

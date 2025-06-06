#!/usr/bin/env node
import path from 'node:path';
import { Runner } from './index';
import type { Flow, Context } from './index';

async function loadModule(modPath: string): Promise<Record<string, unknown>> {
  const resolved = path.isAbsolute(modPath) ? modPath : path.resolve(process.cwd(), modPath);
  try {
    return await import(resolved);
  } catch {
    // Fallback for environments without dynamic import support (e.g., Jest)
     
    return require(resolved);
  }
}

export async function run(flowModulePath: string): Promise<void> {
  const mod = (await loadModule(flowModulePath)) as {
    default?: Flow;
    flow?: Flow;
    context?: Context;
  };
  const flow: Flow | undefined = mod.flow ?? mod.default;
  if (!flow) {
    throw new Error('Flow instance not found. Export `flow` or default.');
  }
  const context: Context = mod.context ?? {
    conversationHistory: [],
    data: {},
    metadata: {},
  };
  const runner = new Runner();
  const result = await runner.runFlow(flow, context);
  console.log(JSON.stringify(result, null, 2));
}

export async function inspect(flowModulePath: string): Promise<void> {
  const mod = (await loadModule(flowModulePath)) as {
    default?: Flow;
    flow?: Flow;
  };
  const flow: Flow | undefined = mod.flow ?? mod.default;
  if (!flow) {
    throw new Error('Flow instance not found. Export `flow` or default.');
  }

  const nodes = Array.from((flow as any).nodes.values()).map((n: any) => ({
    id: n.getId(),
    type: n.constructor.name,
  }));
  const transitions: Record<string, Record<string, string>> = {};
  for (const [from, map] of (flow as any).transitions.entries()) {
    transitions[from] = Object.fromEntries(map.entries());
  }
  const start = (flow as any).startNodeId;
  const info = { id: flow.getId(), start, nodes, transitions };
  console.log(JSON.stringify(info, null, 2));
}

if (require.main === module) {
  const [, , command, file] = process.argv;
  if (!command || !file) {
    console.log('Usage: aaflow <run|inspect> <path-to-flow-module>');
    process.exit(0);
  }
  const fn = command === 'run' ? run : command === 'inspect' ? inspect : null;
  if (!fn) {
    console.log('Usage: aaflow <run|inspect> <path-to-flow-module>');
    process.exit(1);
  }
  fn(file).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

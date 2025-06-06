#!/usr/bin/env node
import path from 'node:path';
import { Runner } from './index';
import type { Flow, Context } from './index';

export async function run(flowModulePath: string): Promise<void> {
  const resolved = path.isAbsolute(flowModulePath)
    ? flowModulePath
    : path.resolve(process.cwd(), flowModulePath);
  const mod = (await import(resolved)) as {
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

if (require.main === module) {
  const [, , command, file] = process.argv;
  if (command !== 'run' || !file) {
    console.log('Usage: aaflow run <path-to-flow-module>');
    process.exit(command ? 1 : 0);
  } else {
    run(file).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }
}

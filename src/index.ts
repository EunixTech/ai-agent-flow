export * from './nodes/action';
export * from './nodes/llm';
export * from './nodes/decision';
export * from './nodes/batch';
export * from './nodes/http';
export * from './types';
export * from './utils/message-bus';
export { RedisMessageBus } from './utils/redis-message-bus';
export * from './store';
export * from './plugins';

import type { Context, NodeResult, Transition } from './types';
import { Node } from './nodes/base';
import { ActionNode } from './nodes/action';
import type { Plugin } from './plugins';
import { loadPluginSync, loadPluginsFromDirSync } from './plugins';
import fs from 'fs';

export type { Context, NodeResult, Transition };
export { Node, ActionNode };

export class Flow {
  private id: string;
  private nodes = new Map<string, Node>();
  private transitions = new Map<string, Map<string, string>>();
  private startNodeId?: string;

  constructor(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  addNode(node: Node): Flow {
    this.nodes.set(node.getId(), node);
    return this;
  }

  setStartNode(nodeId: string): Flow {
    this.startNodeId = nodeId;
    return this;
  }

  addTransition(fromNodeId: string, { action, to }: Transition): Flow {
    if (!this.transitions.has(fromNodeId)) {
      this.transitions.set(fromNodeId, new Map());
    }
    this.transitions.get(fromNodeId)!.set(action, to);
    return this;
  }

  async run(context: Context): Promise<NodeResult> {
    if (!this.startNodeId) throw new Error('Start node not defined');
    let currentNodeId = this.startNodeId;

    while (currentNodeId) {
      const node = this.nodes.get(currentNodeId);
      if (!node) throw new Error(`Node ${currentNodeId} not found`);

      const result = await node.execute(context);
      if (result.type === 'error') return result;

      const action = result.action || 'default';
      const nextNodeId = this.transitions.get(currentNodeId)?.get(action);
      if (!nextNodeId) break;

      currentNodeId = nextNodeId;
    }

    return { type: 'success', output: 'Flow completed' };
  }
}

export class Runner {
  private updateHandler?: (update: { type: string; content: string }) => void;
  private plugins: Plugin[] = [];

  onUpdate(handler: (update: { type: string; content: string }) => void): void {
    this.updateHandler = handler;
  }

  constructor(
    private maxRetries = 3,
    private retryDelay = 1000,
    private store?: import('./store').ContextStore,
    plugins: (Plugin | string)[] = [],
  ) {
    this.registerPlugins(plugins);
  }

  getPlugins(): Plugin[] {
    return this.plugins;
  }

  registerPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
    try {
      plugin.setup(this);
    } catch {
      // ignore plugin errors during setup
    }
  }

  registerPlugins(plugins: (Plugin | string)[]): void {
    for (const p of plugins) {
      if (typeof p === 'string') {
        if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
          const loaded = loadPluginsFromDirSync(p);
          loaded.forEach((pl) => this.registerPlugin(pl));
        } else {
          const plugin = loadPluginSync(p);
          if (plugin) this.registerPlugin(plugin);
        }
      } else {
        this.registerPlugin(p);
      }
    }
  }

  async runFlow(flow: Flow, context: Context, contextId?: string): Promise<NodeResult> {
    if (this.store && contextId) {
      const loaded = await this.store.load(contextId);
      if (loaded) {
        context = loaded;
      }
    }
    // Attach update handler to context for streaming nodes
    if (this.updateHandler) {
      context.metadata.__updateHandler = this.updateHandler;
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const result = await flow.run(context);
      if (result.type === 'success') {
        if (this.updateHandler) {
          const content =
            typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
          this.updateHandler({ type: 'chunk', content });
        }
        if (this.store && contextId) {
          await this.store.save(contextId, context);
        }
        if (this.store && contextId) {
          await this.store.save(contextId, context);
        }
        return result;
      }
      if (attempt < this.maxRetries) await new Promise((res) => setTimeout(res, this.retryDelay));
    }
    const errorResult: NodeResult = {
      type: 'error',
      error: new Error('Max retries reached'),
    };
    if (this.store && contextId) {
      await this.store.save(contextId, context);
    }
    return errorResult;
  }

  async runAgentFlows(
    flows: Flow[],
    contextMap: Record<string, Context>,
    parallel = false,
  ): Promise<Record<string, NodeResult>> {
    const execute = async (flow: Flow): Promise<[string, NodeResult]> => {
      const id = flow.getId();
      const ctx = contextMap[id] || { conversationHistory: [], data: {}, metadata: {} };
      const result = await this.runFlow(flow, ctx, id);
      return [id, result];
    };

    if (parallel) {
      const entries = await Promise.all(flows.map((f) => execute(f)));
      return Object.fromEntries(entries);
    }

    const results: Record<string, NodeResult> = {};
    for (const flow of flows) {
      const [id, res] = await execute(flow);
      results[id] = res;
    }
    return results;
  }
}

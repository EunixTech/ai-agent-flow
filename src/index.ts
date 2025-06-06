export * from './nodes/action';
export * from './nodes/llm';
export * from './nodes/decision';
export * from './nodes/batch';
export * from './types';
export * from './utils/message-bus';
export * from './store';

import type { Context, NodeResult, Transition } from './types';
import { Node } from './nodes/base';
import { ActionNode } from './nodes/action';

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

  onUpdate(handler: (update: { type: string; content: string }) => void): void {
    this.updateHandler = handler;
  }

  constructor(
    private maxRetries = 3,
    private retryDelay = 1000,
    private store?: import('./store').ContextStore,
  ) {}

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
          this.updateHandler({ type: 'chunk', content: result.output as string });
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
}

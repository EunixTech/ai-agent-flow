import { InMemoryContextStore } from '../src/store/memory';
import { Flow, Runner } from '../src/index';
import { ActionNode } from '../src/nodes/action';
import type { Context } from '../src/types';

describe('ContextStore and Runner integration', () => {
  it('persists context between runs', async () => {
    const store = new InMemoryContextStore();
    const node = new ActionNode('start', async (ctx) => {
      ctx.data.count = ((ctx.data.count as number | undefined) ?? 0) + 1;
      return 'done';
    });
    const flow = new Flow('test').addNode(node).setStartNode('start');
    const runner = new Runner(1, 10, store);

    const context: Context = { conversationHistory: [], data: {}, metadata: {} };
    await runner.runFlow(flow, context, 'id1');
    let saved = await store.load('id1');
    expect(saved?.data.count).toBe(1);

    await runner.runFlow(flow, { conversationHistory: [], data: {}, metadata: {} }, 'id1');
    saved = await store.load('id1');
    expect(saved?.data.count).toBe(2);
  });
});

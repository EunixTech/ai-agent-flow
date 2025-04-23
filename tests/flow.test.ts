import { Flow } from '../src/index';
import { ActionNode } from '../src/nodes/action';
import { Context } from '../src/types';

describe('Flow', () => {
  it('runs two connected nodes', async () => {
    const ctx: Context = { conversationHistory: [], data: {}, metadata: {} };

    const n1 = new ActionNode('n1', async () => 'step1');
    const n2 = new ActionNode('n2', async () => 'done');

    const flow = new Flow('test')
      .addNode(n1)
      .addNode(n2)
      .setStartNode('n1')
      .addTransition('n1', { action: 'default', to: 'n2' });

    const result = await flow.run(ctx);
    expect(result.type).toBe('success');
  });
});

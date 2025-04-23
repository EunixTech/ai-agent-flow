import { Flow } from '../src/index';
import { ActionNode } from '../src/nodes/action';
import { Context } from '../src/types';

describe('Flow Error Handling', () => {
  const context: Context = { conversationHistory: [], data: {}, metadata: {} };

  it('throws if start node is not set', async () => {
    const flow = new Flow('no-start-node');
    await expect(flow.run(context)).rejects.toThrow('Start node not defined');
  });

  it('throws if a node ID is missing', async () => {
    const node = new ActionNode('start', async () => 'next');
    const flow = new Flow('missing-node')
      .addNode(node)
      .setStartNode('start')
      .addTransition('start', { action: 'default', to: 'does-not-exist' });

    await expect(flow.run(context)).rejects.toThrow('Node does-not-exist not found');
  });

  it('stops if transition not matched', async () => {
    const node = new ActionNode('solo', async () => 'no-transition');
    const flow = new Flow('no-transition').addNode(node).setStartNode('solo');

    const result = await flow.run(context);
    expect(result.type).toBe('success');
    if (result.type === 'success') {
      expect(result.output).toBe('Flow completed');
    }
  });
});

import { Flow, Runner } from '../src/index';
import { ActionNode } from '../src/nodes/action';
import { Context } from '../src/types';

describe('Runner', () => {
  it('retries failing node and succeeds', async () => {
    let count = 0;
    const failingNode = new ActionNode('retry', async () => {
      if (count++ < 2) throw new Error('fail');
      return 'finally';
    });

    const flow = new Flow('retry-flow').addNode(failingNode).setStartNode('retry');

    const context: Context = {
      conversationHistory: [],
      data: {},
      metadata: {},
    };
    const runner = new Runner(3, 10);

    const result = await runner.runFlow(flow, context);
    expect(result.type).toBe('success');
  });
  it('returns error after max retries', async () => {
    const node = new ActionNode('fail', async () => {
      throw new Error('always fails');
    });

    const flow = new Flow('failing').addNode(node).setStartNode('fail');

    const runner = new Runner(2, 10);
    const context: Context = {
      conversationHistory: [],
      data: {},
      metadata: {},
    };

    const result = await runner.runFlow(flow, context);
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.error.message).toBe('Max retries reached');
    }
  });

  it('calls update handler on success', async () => {
    const node = new ActionNode('start', async () => 'done');
    const flow = new Flow('simple').addNode(node).setStartNode('start');

    const context: Context = {
      conversationHistory: [],
      data: {},
      metadata: {},
    };

    const runner = new Runner();
    const onUpdate = jest.fn();
    runner.onUpdate(onUpdate);

    await runner.runFlow(flow, context);

    expect(onUpdate).toHaveBeenCalledWith({
      type: 'chunk',
      content: 'Flow completed',
    });
  });
});

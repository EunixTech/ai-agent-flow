import { Flow, Runner } from '../src/index';
import { ActionNode } from '../src/nodes/action';
import { LLMNode } from '../src/nodes/llm';
import { Context } from '../src/types';

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn((params) => {
            if (params.stream) {
              const chunks = [
                { choices: [{ delta: { content: 'Hello' } }] },
                { choices: [{ delta: { content: ' World' } }] },
              ];
              return Promise.resolve({
                [Symbol.asyncIterator]: async function* () {
                  for (const c of chunks) yield c;
                },
              });
            }
            return Promise.resolve({ choices: [{ message: { content: 'Mocked' } }] });
          }),
        },
      },
    };
  });
});

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

  it('handles streaming updates', async () => {
    const node = new LLMNode('stream', () => 'Hi');
    const flow = new Flow('streaming').addNode(node).setStartNode('stream');

    const context: Context = { conversationHistory: [], data: {}, metadata: {} };
    const runner = new Runner();
    const onUpdate = jest.fn();
    runner.onUpdate(onUpdate);

    await runner.runFlow(flow, context);

    expect(onUpdate).toHaveBeenNthCalledWith(1, { type: 'chunk', content: 'Hello' });
    expect(onUpdate).toHaveBeenNthCalledWith(2, { type: 'chunk', content: ' World' });
    expect(onUpdate).toHaveBeenLastCalledWith({ type: 'chunk', content: 'Flow completed' });
  });
});

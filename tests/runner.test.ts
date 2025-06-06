import { Flow, Runner } from '../src/index';
import { ActionNode } from '../src/nodes/action';
import { LLMNode } from '../src/nodes/llm';
import { Context, NodeResult } from '../src/types';

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

  class TestFlow extends Flow {
    constructor(private testOutput: unknown) {
      super('test');
      this.testOutput = testOutput;
    }

    async run(_: Context): Promise<NodeResult> {
      return { type: 'success', output: this.testOutput };
    }
  }

  it('stringifies object outputs for update handler', async () => {
    const obj = { foo: 'bar' };
    const flow = new TestFlow(obj);

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
      content: JSON.stringify(obj),
    });
  });

  it('stringifies array outputs for update handler', async () => {
    const arr = [1, 2, 3];
    const flow = new TestFlow(arr);

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
      content: JSON.stringify(arr),
    });
  });

  it('handles streaming updates', async () => {
    const node = new LLMNode('stream', {
      messages: () => [{ role: 'user', content: 'Hi' }],
    });
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

  it('runs multiple flows sequentially', async () => {
    const events: string[] = [];

    const flow1 = new Flow('f1').addNode(
      new ActionNode('n1', async () => {
        events.push('start1');
        await new Promise((r) => setTimeout(r, 50));
        events.push('end1');
        return 'one';
      }),
    ).setStartNode('n1');

    const flow2 = new Flow('f2').addNode(
      new ActionNode('n2', async () => {
        events.push('start2');
        await new Promise((r) => setTimeout(r, 10));
        events.push('end2');
        return 'two';
      }),
    ).setStartNode('n2');

    const ctx1: Context = { conversationHistory: [], data: {}, metadata: {} };
    const ctx2: Context = { conversationHistory: [], data: {}, metadata: {} };

    const runner = new Runner();
    const results = await runner.runAgentFlows([flow1, flow2], { f1: ctx1, f2: ctx2 });

    expect(events).toEqual(['start1', 'end1', 'start2', 'end2']);
    expect(results.f1.type).toBe('success');
    expect(results.f2.type).toBe('success');
  });

  it('runs multiple flows in parallel', async () => {
    const events: string[] = [];

    const flow1 = new Flow('p1').addNode(
      new ActionNode('n1', async () => {
        events.push('pstart1');
        await new Promise((r) => setTimeout(r, 50));
        events.push('pend1');
        return 'one';
      }),
    ).setStartNode('n1');

    const flow2 = new Flow('p2').addNode(
      new ActionNode('n2', async () => {
        events.push('pstart2');
        await new Promise((r) => setTimeout(r, 10));
        events.push('pend2');
        return 'two';
      }),
    ).setStartNode('n2');

    const ctx1: Context = { conversationHistory: [], data: {}, metadata: {} };
    const ctx2: Context = { conversationHistory: [], data: {}, metadata: {} };

    const runner = new Runner();
    const results = await runner.runAgentFlows(
      [flow1, flow2],
      { p1: ctx1, p2: ctx2 },
      true,
    );

    expect(events[0]).toBe('pstart1');
    expect(events[1]).toBe('pstart2');
    expect(events.slice(2)).toEqual(['pend2', 'pend1']);
    expect(results.p1.type).toBe('success');
    expect(results.p2.type).toBe('success');
  });
});


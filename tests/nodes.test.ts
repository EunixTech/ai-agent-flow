import { ActionNode } from '../src/nodes/action';
import { DecisionNode } from '../src/nodes/decision';
import { BatchNode, BatchItem, BatchResult } from '../src/nodes/batch';
import { Context } from '../src/types';

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn((params) => {
            if (params.model === 'invalid-model') {
              return Promise.reject(new Error('Invalid model configuration'));
            }
            return Promise.resolve({
              choices: [{ message: { content: 'Mocked response from OpenAI' } }],
            });
          }),
        },
      },
    };
  });
});

import { LLMNode } from '../src/nodes/llm';

describe('Nodes', () => {
  const context: Context = {
    conversationHistory: [],
    data: { items: [1, 2] },
    metadata: {},
  };

  it('ActionNode returns expected output', async () => {
    const node = new ActionNode('log', async () => 'ok');
    const result = await node.execute(context);
    expect(result.type).toBe('success');
    if (result.type === 'success') {
      expect(result.output).toBe('ok');
    }
  });

  it('DecisionNode chooses path based on context', async () => {
    const node = new DecisionNode('check', (ctx) => (ctx.data.role === 'admin' ? 'admin' : 'user'));
    context.data.role = 'admin';
    const result = await node.execute(context);
    expect(result.type).toBe('success');
    if (result.type === 'success') {
      expect(result.output).toBe('admin');
    }
  });

  describe('BatchNode', () => {
    it('processes items with number types', async () => {
      const node = new BatchNode<number, number>('batch', 'items', async (item) => item * 2);
      const result = await node.execute(context);
      expect(result.type).toBe('success');
      if (result.type === 'success') {
        expect(result.output).toEqual([2, 4]);
      }
    });

    it('processes items with string types', async () => {
      const stringContext: Context = {
        conversationHistory: [],
        data: { items: ['a', 'b'] },
        metadata: {},
      };
      const node = new BatchNode<string, number>(
        'string-batch',
        'items',
        async (item) => item.length,
      );
      const result = await node.execute(stringContext);
      expect(result.type).toBe('success');
      if (result.type === 'success') {
        expect(result.output).toEqual([1, 1]);
      }
    });

    it('processes items with custom types', async () => {
      interface User {
        id: number;
        name: string;
      }
      interface UserResponse {
        id: number;
        greeting: string;
      }

      const userContext: Context = {
        conversationHistory: [],
        data: {
          items: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ] as User[],
        },
        metadata: {},
      };

      const node = new BatchNode<User, UserResponse>('user-batch', 'items', async (user) => ({
        id: user.id,
        greeting: `Hello, ${user.name}!`,
      }));

      const result = await node.execute(userContext);
      expect(result.type).toBe('success');
      if (result.type === 'success') {
        expect(result.output).toEqual([
          { id: 1, greeting: 'Hello, Alice!' },
          { id: 2, greeting: 'Hello, Bob!' },
        ]);
      }
    });

    it('handles errors from item processor', async () => {
      const node = new BatchNode<number, number>('fail-batch', 'items', async () => {
        throw new Error('fail item');
      });
      const result = await node.execute(context);
      expect(result.type).toBe('error');
      if (result.type === 'error') {
        expect(result.error.message).toBe('fail item');
      }
    });

    it('works with empty item list', async () => {
      const ctx: Context = {
        conversationHistory: [],
        data: { items: [] },
        metadata: {},
      };
      const node = new BatchNode<number, number>('empty-batch', 'items', async (item) => item);
      const result = await node.execute(ctx);
      expect(result.type).toBe('success');
      if (result.type === 'success') {
        expect(result.output).toEqual([]);
      }
    });

    it('handles missing items key gracefully', async () => {
      const ctx: Context = {
        conversationHistory: [],
        data: {},
        metadata: {},
      };
      const node = new BatchNode<number, number>('missing-items', 'items', async (item) => item);
      const result = await node.execute(ctx);
      expect(result.type).toBe('success');
      if (result.type === 'success') {
        expect(result.output).toEqual([]);
      }
    });
  });

  it('ActionNode handles error gracefully', async () => {
    const node = new ActionNode('fail-node', async () => {
      throw new Error('boom');
    });
    const result = await node.execute(context);
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.error.message).toBe('boom');
    }
  });
  it('ActionNode handles non-Error thrown value', async () => {
    const node = new ActionNode('throw-string', async () => {
      throw 'some error';
    });
    const result = await node.execute(context);
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe('some error');
    }
  });
  it('DecisionNode handles exception in condition function', async () => {
    const node = new DecisionNode('broken', () => {
      throw new Error('bad decision');
    });
    const result = await node.execute(context);
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.error.message).toBe('bad decision');
    }
  });
});

describe('LLMNode', () => {
  it('executes successfully with valid context', async () => {
    const node = new LLMNode('chat', (context) => {
      if (!context.data.userInput) {
        throw new Error('Invalid model configuration');
      }
      return `User input: ${context.data.userInput}`;
    });

    const context = {
      conversationHistory: [],
      data: { userInput: 'What is the weather today?' },
      metadata: {},
    };

    const result = await node.execute(context);
    expect(result.type).toBe('success');
    if (result.type === 'success') {
      expect(result.output).toBeDefined();
    }
  });

  it('handles errors gracefully', async () => {
    const node = new LLMNode('chat', (context) => {
      if (!context.data.userInput) {
        throw new Error('Invalid model configuration');
      }
      return `User input: ${context.data.userInput}`;
    });

    const context = {
      conversationHistory: [],
      data: {},
      metadata: {},
    };

    const result = await node.execute(context);
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.error.message).toBe('Invalid model configuration');
    }
  });
});

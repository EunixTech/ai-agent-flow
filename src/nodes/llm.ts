import { Node } from './base';
import { Context, NodeResult } from '../types';
import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI();
  }
  return openai;
}

export class LLMNode extends Node {
  constructor(
    id: string,
    private promptTemplate: (context: Context) => string,
  ) {
    super(id);
    if (typeof promptTemplate !== 'function') {
      throw new Error('promptTemplate must be a function');
    }
  }

  async execute(context: Context): Promise<NodeResult> {
    try {
      const prompt = this.promptTemplate(context);
      if (typeof prompt !== 'string' || !prompt.trim()) {
        return {
          type: 'error',
          error: new Error('Prompt must be a non-empty string'),
        };
      }

      context.conversationHistory.push({ role: 'user', content: prompt });

      const stream = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: context.conversationHistory,
        stream: true,
      });

      let content = '';
      const update = context.metadata.__updateHandler as
        | ((update: { type: string; content: string }) => void)
        | undefined;

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content;
        if (token) {
          content += token;
          if (update) update({ type: 'chunk', content: token });
        }
      }

      context.conversationHistory.push({ role: 'assistant', content });

      return { type: 'success', output: content };
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

import { Node } from '../index';
import { Context, NodeResult } from '../types';
import OpenAI from 'openai';

const openai = new OpenAI();

export class LLMNode extends Node {
  constructor(
    id: string,
    private promptTemplate: (context: Context) => string,
  ) {
    super(id);
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

      const res = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: context.conversationHistory,
      });

      const content = res.choices[0]?.message?.content || '';
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

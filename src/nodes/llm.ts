import { Node } from './base';
import { Context, NodeResult } from '../types';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI();
  }
  return openai;
}

export class LLMNode extends Node {
  private model: string;
  private messagesFn: (context: Context) => ChatCompletionMessageParam[];

  constructor(
    id: string,
    {
      model,
      messages,
    }: { model?: string; messages: (context: Context) => ChatCompletionMessageParam[] },
  ) {
    super(id);
    if (typeof messages !== 'function') {
      throw new Error('messages must be a function');
    }
    this.model = model || 'gpt-3.5-turbo';
    this.messagesFn = messages;
  }

  async execute(context: Context): Promise<NodeResult> {
    try {
      const messages = this.messagesFn(context);
      if (!Array.isArray(messages) || messages.length === 0) {
        return {
          type: 'error',
          error: new Error('Messages must be a non-empty array'),
        };
      }

      context.conversationHistory.push(...messages);

      const stream = await getOpenAI().chat.completions.create({
        model: this.model,
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

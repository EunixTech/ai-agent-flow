import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface Context {
  conversationHistory: ChatCompletionMessageParam[];
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export type NodeResult =
  | { type: 'success'; output: unknown; action?: string }
  | { type: 'error'; error: Error };

export interface Transition {
  action: string;
  to: string;
}

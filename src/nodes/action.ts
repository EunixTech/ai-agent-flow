import { Node } from './base';
import type { Context, NodeResult } from '../types';

export class ActionNode extends Node {
  private action: (context: Context) => Promise<unknown>;

  constructor(id: string, action: (context: Context) => Promise<unknown>) {
    super(id);
    this.action = action;
  }

  async execute(context: Context): Promise<NodeResult> {
    try {
      const output = await this.action(context);
      return {
        type: 'success',
        output,
      };
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

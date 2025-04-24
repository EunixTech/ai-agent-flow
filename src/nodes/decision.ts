import { Node } from './base';
import { Context, NodeResult } from '../types';

type ConditionFn = (context: Context) => string;

export class DecisionNode extends Node {
  constructor(
    id: string,
    private conditionFn: ConditionFn,
  ) {
    super(id);
  }

  async execute(context: Context): Promise<NodeResult> {
    try {
      const action = this.conditionFn(context);
      return { type: 'success', output: action, action };
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

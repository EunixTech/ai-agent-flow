import type { Context, NodeResult } from '../types';

export abstract class Node {
  protected id: string;

  constructor(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  abstract execute(context: Context): Promise<NodeResult>;
}

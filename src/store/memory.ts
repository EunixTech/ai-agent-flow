import type { Context } from '../types';
import { ContextStore } from './context-store';

/** Simple in-memory implementation of {@link ContextStore}. */
export class InMemoryContextStore implements ContextStore {
  private store = new Map<string, Context>();

  async load(id: string): Promise<Context | null> {
    return this.store.get(id) || null;
  }

  async save(id: string, context: Context): Promise<void> {
    this.store.set(id, context);
  }
}

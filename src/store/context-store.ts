import type { Context } from '../types';

export interface ContextStore {
  load(id: string): Promise<Context | null>;
  save(id: string, context: Context): Promise<void>;
}

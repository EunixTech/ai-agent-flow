import { Context } from "../types";

const store: Record<string, Context> = {};

export const InMemoryStore = {
  save(id: string, context: Context) {
    store[id] = context;
  },

  load(id: string): Context | null {
    return store[id] || null;
  },
};

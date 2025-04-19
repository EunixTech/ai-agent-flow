import { createClient } from "redis";
import { Context } from "../types";

const client = createClient();
client.connect();

export const RedisStore = {
  async save(id: string, context: Context) {
    await client.set(id, JSON.stringify(context));
  },

  async load(id: string): Promise<Context | null> {
    const raw = await client.get(id);
    return raw ? JSON.parse(raw) : null;
  },
};

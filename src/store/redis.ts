import Redis from 'ioredis';
import type { Context } from '../types';
import { ContextStore } from './context-store';

/** Options for {@link RedisContextStore}. */
export interface RedisContextStoreOptions {
  /** Existing Redis client to use. */
  client?: Redis;
  /** Connection URL if a client is not provided. */
  url?: string;
}

/** A Redis-backed implementation of {@link ContextStore}. */
export class RedisContextStore implements ContextStore {
  private client: Redis;

  constructor(options: RedisContextStoreOptions = {}) {
    if (options.client) {
      this.client = options.client;
    } else if (options.url) {
      this.client = new Redis(options.url);
    } else {
      this.client = new Redis();
    }
  }

  async load(id: string): Promise<Context | null> {
    const data = await this.client.get(id);
    return data ? (JSON.parse(data) as Context) : null;
  }

  async save(id: string, context: Context): Promise<void> {
    await this.client.set(id, JSON.stringify(context));
  }
}

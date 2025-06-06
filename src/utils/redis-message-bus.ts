import { EventEmitter } from 'events';
import Redis from 'ioredis';

export interface RedisMessageBusOptions {
  publisher?: Redis;
  subscriber?: Redis;
  url?: string;
}

export class RedisMessageBus extends EventEmitter {
  private publisher: Redis;
  private subscriber: Redis;
  private subscribed = new Set<string>();

  constructor(options: RedisMessageBusOptions = {}) {
    super();
    if (options.publisher) {
      this.publisher = options.publisher;
    } else if (options.url) {
      this.publisher = new Redis(options.url);
    } else {
      this.publisher = new Redis();
    }

    if (options.subscriber) {
      this.subscriber = options.subscriber;
    } else if (options.url) {
      this.subscriber = new Redis(options.url);
    } else {
      this.subscriber = new Redis();
    }

    this.subscriber.on('message', (channel, message) => {
      try {
        const { senderId, payload } = JSON.parse(message);
        this.emit(channel, senderId, payload);
      } catch {
        // ignore malformed messages
      }
    });
  }

  send(senderId: string, receiverId: string, message: unknown): void {
    void this.publisher.publish(receiverId, JSON.stringify({ senderId, payload: message }));
  }

  publish(receiverId: string, message: unknown): void {
    this.send('system', receiverId, message);
  }

  subscribe(receiverId: string, callback: (senderId: string, message: unknown) => void): void {
    this.on(receiverId, callback);
    if (!this.subscribed.has(receiverId)) {
      this.subscribed.add(receiverId);
      void this.subscriber.subscribe(receiverId);
    }
  }
}

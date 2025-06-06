import { RedisMessageBus } from '../src/utils/redis-message-bus';
import { EventEmitter } from 'events';

class MockRedis extends EventEmitter {
  constructor(private bus: EventEmitter) {
    super();
  }
  async publish(channel: string, message: string) {
    this.bus.emit(channel, message);
    return 1;
  }
  async subscribe(channel: string) {
    this.bus.on(channel, (msg) => this.emit('message', channel, msg));
    return 1;
  }
}

describe('RedisMessageBus', () => {
  it('sends and receives messages', (done) => {
    const shared = new EventEmitter();
    const pub = new MockRedis(shared);
    const sub = new MockRedis(shared);
    const bus = new RedisMessageBus({ publisher: pub as any, subscriber: sub as any });

    bus.subscribe('agentB', (sender, msg) => {
      expect(sender).toBe('agentA');
      expect(msg).toBe('hello');
      done();
    });

    bus.send('agentA', 'agentB', 'hello');
  });

  it('publishes system messages', (done) => {
    const shared = new EventEmitter();
    const pub = new MockRedis(shared);
    const sub = new MockRedis(shared);
    const bus = new RedisMessageBus({ publisher: pub as any, subscriber: sub as any });

    bus.subscribe('news', (sender, msg) => {
      expect(sender).toBe('system');
      expect(msg).toBe('update');
      done();
    });

    bus.publish('news', 'update');
  });
});

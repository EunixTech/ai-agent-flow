import { EventEmitter } from 'events';

export class MessageBus extends EventEmitter {
  send(senderId: string, receiverId: string, message: unknown): void {
    this.emit(receiverId, senderId, message);
  }

  /**
   * Alias for {@link send} to match documentation examples.
   *
   * @param receiverId - The id of the receiver agent
   * @param message - The message payload
   */
  publish(receiverId: string, message: unknown): void {
    this.send('system', receiverId, message);
  }

  subscribe(receiverId: string, callback: (senderId: string, message: unknown) => void): void {
    this.on(receiverId, callback);
  }
}

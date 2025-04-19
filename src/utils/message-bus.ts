import { EventEmitter } from "events";

export class MessageBus extends EventEmitter {
  send(senderId: string, receiverId: string, message: unknown): void {
    this.emit(receiverId, senderId, message);
  }

  subscribe(
    receiverId: string,
    callback: (senderId: string, message: unknown) => void
  ): void {
    this.on(receiverId, callback);
  }
}

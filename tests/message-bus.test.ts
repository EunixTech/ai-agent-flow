import { MessageBus } from "../src/utils/message-bus";

describe("MessageBus", () => {
  it("should send and receive messages", (done) => {
    const bus = new MessageBus();
    bus.subscribe("agentB", (senderId, message) => {
      expect(senderId).toBe("agentA");
      expect(message).toBe("hello");
      done();
    });
    bus.send("agentA", "agentB", "hello");
  });
});

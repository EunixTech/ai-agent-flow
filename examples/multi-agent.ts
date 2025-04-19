import { MessageBus } from "../src/utils/message-bus";

const bus = new MessageBus();

bus.subscribe("billing-agent", (sender, message) => {
  console.log(`Billing received: ${message}`);
  bus.send("billing-agent", "support-agent", "Billing done");
});

bus.subscribe("support-agent", (sender, message) => {
  console.log(`Support received: ${message}`);
});

bus.send("support-agent", "billing-agent", "Process payment");

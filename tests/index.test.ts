import { Flow, Runner } from "../src/index";
import { ActionNode } from "../src/nodes/action";
import { Context } from "../src/types";

describe("Flow & Runner", () => {
  it("should execute a basic flow", async () => {
    const context: Context = {
      conversationHistory: [],
      data: {},
      metadata: {},
    };

    const node1 = new ActionNode("start", async () => "step1");
    const node2 = new ActionNode("end", async () => "done");

    const flow = new Flow("test-flow")
      .addNode(node1)
      .addNode(node2)
      .setStartNode("start")
      .addTransition("start", { action: "default", to: "end" });

    const runner = new Runner();
    const result = await runner.runFlow(flow, context);

    expect(result.type).toBe("success");
    if (result.type === "success") {
      expect(result.output).toBe("Flow completed");
    }
  });
});

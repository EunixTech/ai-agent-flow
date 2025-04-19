import { ActionNode } from "../src/nodes/action";
import { DecisionNode } from "../src/nodes/decision";
import { BatchNode } from "../src/nodes/batch";
import { Context } from "../src/types";

describe("Nodes", () => {
  const context: Context = {
    conversationHistory: [],
    data: { items: [1, 2] },
    metadata: {},
  };

  it("ActionNode returns expected output", async () => {
    const node = new ActionNode("log", async () => "ok");
    const result = await node.execute(context);
    expect(result.type).toBe("success");
    if (result.type === "success") {
      expect(result.output).toBe("ok");
    }
  });

  it("DecisionNode chooses path based on context", async () => {
    const node = new DecisionNode("check", (ctx) =>
      ctx.data.role === "admin" ? "admin" : "user"
    );
    context.data.role = "admin";
    const result = await node.execute(context);
    expect(result.type).toBe("success");
    if (result.type === "success") {
      expect(result.output).toBe("admin");
    }
  });

  it("BatchNode processes items", async () => {
    const node = new BatchNode("batch", "items", async (item) => item * 2);
    const result = await node.execute(context);
    expect(result.type).toBe("success");
    if (result.type === "success") {
      expect(result.output).toEqual([2, 4]);
    }
  });

  it("ActionNode handles error gracefully", async () => {
    const node = new ActionNode("fail-node", async () => {
      throw new Error("boom");
    });
    const result = await node.execute(context);
    expect(result.type).toBe("error");
    if (result.type === "error") {
      expect(result.error.message).toBe("boom");
    }
  });
  it("ActionNode handles non-Error thrown value", async () => {
    const node = new ActionNode("throw-string", async () => {
      throw "some error";
    });
    const result = await node.execute(context);
    expect(result.type).toBe("error");
    if (result.type === "error") {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("some error");
    }
  });
  it("BatchNode handles errors from item processor", async () => {
    const node = new BatchNode("fail-batch", "items", async () => {
      throw new Error("fail item");
    });
    const result = await node.execute(context);
    expect(result.type).toBe("error");
    if (result.type === "error") {
      expect(result.error.message).toBe("fail item");
    }
  });

  it("BatchNode works with empty item list", async () => {
    const ctx: Context = {
      conversationHistory: [],
      data: { items: [] },
      metadata: {},
    };
    const node = new BatchNode("empty-batch", "items", async (item) => item);
    const result = await node.execute(ctx);
    expect(result.type).toBe("success");
    if (result.type === "success") {
      expect(result.output).toEqual([]);
    }
  });
  it("DecisionNode handles exception in condition function", async () => {
    const node = new DecisionNode("broken", () => {
      throw new Error("bad decision");
    });
    const result = await node.execute(context);
    expect(result.type).toBe("error");
    if (result.type === "error") {
      expect(result.error.message).toBe("bad decision");
    }
  });
});

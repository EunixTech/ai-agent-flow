import { Context, NodeResult, Transition } from "./types";

export abstract class Node {
  protected id: string;

  constructor(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  abstract execute(context: Context): Promise<NodeResult>;
}

export class Flow {
  private id: string;
  private nodes = new Map<string, Node>();
  private transitions = new Map<string, Map<string, string>>();
  private startNodeId?: string;

  constructor(id: string) {
    this.id = id;
  }

  addNode(node: Node): Flow {
    this.nodes.set(node.getId(), node);
    return this;
  }

  setStartNode(nodeId: string): Flow {
    this.startNodeId = nodeId;
    return this;
  }

  addTransition(fromNodeId: string, { action, to }: Transition): Flow {
    if (!this.transitions.has(fromNodeId)) {
      this.transitions.set(fromNodeId, new Map());
    }
    this.transitions.get(fromNodeId)!.set(action, to);
    return this;
  }

  async run(context: Context): Promise<NodeResult> {
    if (!this.startNodeId) throw new Error("Start node not defined");
    let currentNodeId = this.startNodeId;

    while (currentNodeId) {
      const node = this.nodes.get(currentNodeId);
      if (!node) throw new Error(`Node ${currentNodeId} not found`);

      const result = await node.execute(context);
      if (result.type === "error") return result;

      const action = result.action || "default";
      const nextNodeId = this.transitions.get(currentNodeId)?.get(action);
      if (!nextNodeId) break;

      currentNodeId = nextNodeId;
    }

    return { type: "success", output: "Flow completed" };
  }
}

export class Runner {
  constructor(private maxRetries = 3, private retryDelay = 1000) {}

  async runFlow(flow: Flow, context: Context): Promise<NodeResult> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const result = await flow.run(context);
      if (result.type === "success") return result;
      if (attempt < this.maxRetries)
        await new Promise((res) => setTimeout(res, this.retryDelay));
    }
    return { type: "error", error: new Error("Max retries reached") };
  }
}

import { Node } from "../index";
import { Context, NodeResult } from "../types";

export class ActionNode extends Node {
  constructor(
    id: string,
    private actionFn: (context: Context) => Promise<unknown>
  ) {
    super(id);
  }

  async execute(context: Context): Promise<NodeResult> {
    try {
      const output = await this.actionFn(context);
      return { type: "success", output };
    } catch (error) {
      return {
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

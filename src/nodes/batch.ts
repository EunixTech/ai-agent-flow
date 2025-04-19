import { Node } from "../index";
import { Context, NodeResult } from "../types";

type BatchItemFn = (item: any, context: Context) => Promise<unknown>;

export class BatchNode extends Node {
  constructor(
    id: string,
    private itemsKey: string,
    private processItem: BatchItemFn
  ) {
    super(id);
  }

  async execute(context: Context): Promise<NodeResult> {
    try {
      const items = (context.data[this.itemsKey] || []) as any[];
      const results = await Promise.all(
        items.map((item) => this.processItem(item, context))
      );
      return { type: "success", output: results };
    } catch (error) {
      return {
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

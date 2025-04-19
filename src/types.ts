export interface Context {
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export type NodeResult =
  | { type: "success"; output: unknown; action?: string }
  | { type: "error"; error: Error };

export interface Transition {
  action: string;
  to: string;
}

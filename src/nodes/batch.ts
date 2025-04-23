import { Node } from '../index';
import { Context, NodeResult } from '../types';

/**
 * Represents a single item in a batch processing operation.
 * This is a generic type that can be used to specify the type of items being processed.
 *
 * @template T The type of the batch item. Defaults to unknown.
 *
 * @example
 * ```typescript
 * // For number items
 * type NumberItem = BatchItem<number>;
 *
 * // For string items
 * type StringItem = BatchItem<string>;
 *
 * // For custom objects
 * interface User {
 *   id: number;
 *   name: string;
 * }
 * type UserItem = BatchItem<User>;
 * ```
 */
export type BatchItem<T = unknown> = T;

/**
 * Represents the result of processing a single batch item.
 * This is a generic type that can be used to specify the type of results returned.
 *
 * @template T The type of the batch result. Defaults to unknown.
 *
 * @example
 * ```typescript
 * // For number results
 * type NumberResult = BatchResult<number>;
 *
 * // For string results
 * type StringResult = BatchResult<string>;
 *
 * // For custom objects
 * interface UserResponse {
 *   id: number;
 *   greeting: string;
 * }
 * type UserResult = BatchResult<UserResponse>;
 * ```
 */
export type BatchResult<T = unknown> = T;

/**
 * Function type for processing a single batch item.
 * This function takes an item and a context, and returns a promise that resolves to a result.
 *
 * @template TInput The type of the input item.
 * @template TOutput The type of the output result.
 *
 * @example
 * ```typescript
 * // Process numbers
 * const numberProcessor: BatchItemFn<number, number> = async (item, context) => {
 *   return item * 2;
 * };
 *
 * // Process strings
 * const stringProcessor: BatchItemFn<string, number> = async (item, context) => {
 *   return item.length;
 * };
 *
 * // Process custom objects
 * interface User {
 *   id: number;
 *   name: string;
 * }
 * interface UserResponse {
 *   id: number;
 *   greeting: string;
 * }
 *
 * const userProcessor: BatchItemFn<User, UserResponse> = async (user, context) => {
 *   return {
 *     id: user.id,
 *     greeting: `Hello, ${user.name}!`
 *   };
 * };
 * ```
 */
export type BatchItemFn<TInput = unknown, TOutput = unknown> = (
  item: BatchItem<TInput>,
  context: Context,
) => Promise<BatchResult<TOutput>>;

/**
 * A node that processes items in batch.
 * This node takes a list of items from the context and processes them in parallel.
 *
 * @template TInput The type of the input items.
 * @template TOutput The type of the output results.
 *
 * @example
 * ```typescript
 * // Process strings to get their lengths
 * const batchNode = new BatchNode<string, number>(
 *   'process-strings',
 *   'items',
 *   async (item, context) => {
 *     return item.length;
 *   }
 * );
 *
 * // Process users to create greetings
 * interface User {
 *   id: number;
 *   name: string;
 * }
 * interface UserResponse {
 *   id: number;
 *   greeting: string;
 * }
 *
 * const userBatchNode = new BatchNode<User, UserResponse>(
 *   'process-users',
 *   'users',
 *   async (user, context) => {
 *     return {
 *       id: user.id,
 *       greeting: `Hello, ${user.name}!`
 *     };
 *   }
 * );
 *
 * // Execute the node
 * const context: Context = {
 *   conversationHistory: [],
 *   data: {
 *     users: [
 *       { id: 1, name: 'Alice' },
 *       { id: 2, name: 'Bob' }
 *     ]
 *   },
 *   metadata: {}
 * };
 *
 * const result = await userBatchNode.execute(context);
 * if (result.type === 'success') {
 *   console.log(result.output);
 *   // Output: [
 *   //   { id: 1, greeting: 'Hello, Alice!' },
 *   //   { id: 2, greeting: 'Hello, Bob!' }
 *   // ]
 * }
 * ```
 */
export class BatchNode<TInput = unknown, TOutput = unknown> extends Node {
  /**
   * Creates a new BatchNode instance.
   *
   * @param id - Unique identifier for the node
   * @param itemsKey - Key in the context data that contains the items to process
   * @param processItem - Function to process each item in the batch
   *
   * @example
   * ```typescript
   * const node = new BatchNode<number, number>(
   *   'double-numbers',
   *   'numbers',
   *   async (item) => item * 2
   * );
   * ```
   */
  constructor(
    id: string,
    private itemsKey: string,
    private processItem: BatchItemFn<TInput, TOutput>,
  ) {
    super(id);
  }

  /**
   * Executes the batch processing operation.
   * This method retrieves the items from the context using the itemsKey,
   * processes each item in parallel using the processItem function,
   * and returns the results.
   *
   * @param context - The execution context containing the items to process
   * @returns A promise that resolves to the node result containing the processed items
   *
   * @throws Will throw an error if the processing of any item fails
   *
   * @example
   * ```typescript
   * const context: Context = {
   *   conversationHistory: [],
   *   data: { numbers: [1, 2, 3] },
   *   metadata: {}
   * };
   *
   * const result = await node.execute(context);
   * if (result.type === 'success') {
   *   console.log(result.output); // [2, 4, 6]
   * }
   * ```
   */
  async execute(context: Context): Promise<NodeResult> {
    try {
      const items = (context.data[this.itemsKey] || []) as BatchItem<TInput>[];
      const results = await Promise.all(items.map((item) => this.processItem(item, context)));
      return { type: 'success', output: results };
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

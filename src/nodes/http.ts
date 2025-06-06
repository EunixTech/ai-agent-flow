import { Node } from './base';
import type { Context, NodeResult } from '../types';

export interface HttpNodeOptions {
  url: string | ((ctx: Context) => string);
  method?: string;
  headers?: Record<string, string> | ((ctx: Context) => Record<string, string>);
  body?: unknown | ((ctx: Context) => unknown);
}

/**
 * Node for performing HTTP requests using the Fetch API.
 * URL, method, headers and body can be provided statically or
 * resolved at execution time from the Context.
 */
export class HttpNode extends Node {
  private urlFn: (ctx: Context) => string;
  private method: string;
  private headersFn: (ctx: Context) => Record<string, string>;
  private bodyFn?: (ctx: Context) => unknown;

  constructor(id: string, opts: HttpNodeOptions) {
    super(id);

    if (typeof opts.url === 'function') {
      this.urlFn = opts.url;
    } else {
      const url = opts.url;
      this.urlFn = () => url;
    }

    this.method = opts.method || 'GET';

    if (typeof opts.headers === 'function') {
      this.headersFn = opts.headers;
    } else {
      const headers = opts.headers || {};
      this.headersFn = () => headers;
    }

    if (opts.body !== undefined) {
      if (typeof opts.body === 'function') {
        this.bodyFn = opts.body as (ctx: Context) => unknown;
      } else {
        const bodyVal = opts.body;
        this.bodyFn = () => bodyVal;
      }
    }
  }

  async execute(context: Context): Promise<NodeResult> {
    try {
      const url = this.urlFn(context);
      const headers = this.headersFn(context);
      const bodyVal = this.bodyFn ? this.bodyFn(context) : undefined;

      const initHeaders: Record<string, string> = { ...headers };
      const init: RequestInit = { method: this.method, headers: initHeaders };
      if (bodyVal !== undefined) {
        if (
          typeof bodyVal === 'string' ||
          bodyVal instanceof ArrayBuffer ||
          bodyVal instanceof Blob ||
          bodyVal instanceof FormData ||
          bodyVal instanceof URLSearchParams
        ) {
          init.body = bodyVal as any;
        } else {
          init.body = JSON.stringify(bodyVal);
          if (!('Content-Type' in initHeaders)) {
            initHeaders['Content-Type'] = 'application/json';
          }
        }
      }

      const res = await fetch(url, init);
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
      }

      let output: unknown = text;
      try {
        output = JSON.parse(text);
      } catch {
        // response not JSON; keep as text
      }

      return { type: 'success', output };
    } catch (err) {
      return {
        type: 'error',
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}

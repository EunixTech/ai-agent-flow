import { HttpNode } from '../src/nodes/http';
import { Context } from '../src/types';
import http from 'node:http';

describe('HttpNode', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll((done) => {
    server = http
      .createServer((req, res) => {
        if (req.url === '/ok' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ msg: 'hello' }));
        } else if (req.url === '/post' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            const data = JSON.parse(body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: data.value }));
          });
        } else {
          res.writeHead(500);
          res.end('fail');
        }
      })
      .listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr !== 'string') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        done();
      });
  });

  afterAll((done) => {
    server.close(done);
  });

  const ctx: Context = { conversationHistory: [], data: {}, metadata: {} };

  it('performs GET request', async () => {
    const node = new HttpNode('get', { url: () => `${baseUrl}/ok` });
    const result = await node.execute(ctx);
    expect(result.type).toBe('success');
    if (result.type === 'success') {
      expect(result.output).toEqual({ msg: 'hello' });
    }
  });

  it('performs POST request with body', async () => {
    const node = new HttpNode('post', {
      url: () => `${baseUrl}/post`,
      method: 'POST',
      body: () => ({ value: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await node.execute(ctx);
    expect(result.type).toBe('success');
    if (result.type === 'success') {
      expect(result.output).toEqual({ received: 'test' });
    }
  });

  it('returns error on non-2xx status', async () => {
    const node = new HttpNode('fail', { url: () => `${baseUrl}/error` });
    const result = await node.execute(ctx);
    expect(result.type).toBe('error');
  });
});

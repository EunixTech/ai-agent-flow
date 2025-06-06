import { Flow, Runner } from '../src/index';
import { HttpNode } from '../src/nodes/http';
import { Context } from '../src/types';

(async () => {
  const context: Context = {
    conversationHistory: [],
    data: {},
    metadata: {},
  };

  const httpNode = new HttpNode('fetchTodo', {
    url: () => 'https://jsonplaceholder.typicode.com/todos/1',
    method: 'GET',
  });

  const flow = new Flow('http-example')
    .addNode(httpNode)
    .setStartNode('fetchTodo');

  const result = await new Runner().runFlow(flow, context);
  console.log('Result:', result);
})();

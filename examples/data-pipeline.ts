import { Flow, Runner } from '../src/index';
import { BatchNode } from '../src/nodes/batch';
import { Context } from '../src/types';

// Define the user interface
interface User {
  age: number;
}

// Define the result interface
interface UserResult extends User {
  eligible: boolean;
}

(async () => {
  const context: Context = {
    conversationHistory: [],
    data: {
      users: [{ age: 20 }, { age: 30 }] as User[],
    },
    metadata: {},
  };

  const batchNode = new BatchNode<User, UserResult>('process', 'users', async (user) => {
    const result = { ...user, eligible: user.age >= 25 };
    console.log('[BatchNode] Processed:', result);
    return result;
  });

  const flow = new Flow('pipeline').addNode(batchNode).setStartNode('process');

  const result = await new Runner().runFlow(flow, context);

  console.log('🧠 Result:', result);

  if (result.type === 'success') {
    context.data.transformedUsers = result.output;
    console.log('✅ Transformed Output:', context.data.transformedUsers);
  }
})();

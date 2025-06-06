import 'dotenv/config';
import { Flow, Runner, InMemoryContextStore } from '../src/index';
import { LLMNode } from '../src/nodes/llm';
import { DecisionNode } from '../src/nodes/decision';
import { ActionNode } from '../src/nodes/action';
import { Context } from '../src/types';

(async () => {
  const context: Context = {
    conversationHistory: [],
    data: { userQuestion: 'What is the weather today?' },
    metadata: {},
  };

  const llmNode = new LLMNode('llm', {
    messages: (ctx) => [
      { role: 'user', content: ctx.data.userQuestion as string },
    ],
  });

  const decisionNode = new DecisionNode('route', (ctx) =>
    typeof ctx.data.userQuestion === 'string' && ctx.data.userQuestion.includes('weather')
      ? 'weather'
      : 'default',
  );

  const actionNode = new ActionNode('weather', async () => 'It’s sunny.');

  const flow = new Flow('chatbot')
    .addNode(llmNode)
    .addNode(decisionNode)
    .addNode(actionNode)
    .setStartNode('llm')
    .addTransition('llm', { action: 'default', to: 'route' })
    .addTransition('route', { action: 'weather', to: 'weather' });

  const store = new InMemoryContextStore();
  const runner = new Runner(3, 1000, store);
  const result = await runner.runFlow(flow, context, 'chat');

  console.log('🧠 AI said:', context.conversationHistory.at(-1)?.content);
  console.log(result);
})();

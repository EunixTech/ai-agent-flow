import 'dotenv/config';
import { Flow, Runner } from '../src/index';
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

  const llmNode = new LLMNode('llm', (ctx) => ctx.data.userQuestion as string);

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

  const runner = new Runner();
  const result = await runner.runFlow(flow, context);

  console.log('🧠 AI said:', context.conversationHistory.at(-1)?.content);
  console.log(result);
})();

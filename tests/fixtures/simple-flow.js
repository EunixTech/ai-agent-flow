const { Flow, ActionNode } = require('../../src/index');

const flow = new Flow('cli-test')
  .addNode(new ActionNode('start', async () => 'hi'))
  .addNode(new ActionNode('end', async () => 'done'))
  .setStartNode('start')
  .addTransition('start', { action: 'default', to: 'end' });

module.exports = { flow };

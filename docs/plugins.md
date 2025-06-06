# 🔌 Plugin System

ai-agent-flow supports lightweight plugins that can augment the `Runner` at start up.
A plugin is any module that exports an object with a `name` and `setup` function.

```javascript
// my-plugin.js
module.exports = {
  default: {
    name: 'my-plugin',
    setup(runner) {
      // interact with the runner instance
      runner.onUpdate((u) => console.log(u));
    },
  },
};
```

Load plugins by passing them to the `Runner` constructor either directly, via a file path or a directory of plugin files.

```typescript
import path from 'node:path';
import { Runner } from 'ai-agent-flow';

const runner = new Runner(3, 1000, undefined, [
  path.join(__dirname, 'my-plugin.js'), // single plugin
  path.join(__dirname, 'plugins'),      // load all plugins in directory
]);
```

Each plugin's `setup` method is invoked immediately with the runner instance, allowing it to register hooks or modify behavior.

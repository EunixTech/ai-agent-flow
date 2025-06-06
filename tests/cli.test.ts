import path from 'node:path';
import { inspect } from '../src/cli';

describe('CLI inspect', () => {
  it('prints flow structure', async () => {
    const file = path.join(__dirname, 'fixtures', 'simple-flow.js');
    const log = jest.spyOn(console, 'log').mockImplementation();
    await inspect(file);
    expect(log).toHaveBeenCalledTimes(1);
    const output = JSON.parse(log.mock.calls[0][0] as string);
    expect(output.start).toBe('start');
    expect(output.nodes).toContainEqual({ id: 'start', type: 'ActionNode' });
    expect(output.transitions.start.default).toBe('end');
    log.mockRestore();
  });
});

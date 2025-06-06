import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { inspect } from '../src/cli';

const execFileAsync = promisify(execFile);

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

describe('CLI run', () => {
  it('executes a flow via the CLI', async () => {
    const file = path.join(__dirname, 'fixtures', 'simple-flow.js');

    const distCli = path.join(__dirname, '..', 'dist', 'cjs', 'cli.js');
    const srcCli = path.join(__dirname, '..', 'src', 'cli.ts');

    let command = process.execPath;
    let args = [distCli, 'run', file];
    const env = { ...process.env };

    if (!fs.existsSync(distCli)) {
      command = 'npx';
      args = ['-y', 'ts-node', '-T', srcCli, 'run', file];
      env.npm_config_yes = 'true';
    }

    const { stdout } = await execFileAsync(command, args, { env });
    const output = JSON.parse(stdout.trim());
    expect(output).toEqual({ type: 'success', output: 'Flow completed' });
  });
});

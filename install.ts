import { colors, parseArgs } from './src/install/install.deps.ts';
import { Command } from './src/install/commands/Command.ts';
import { HelpCommand } from './src/install/commands/HelpCommand.ts';
import { InstallCommand } from './src/install/commands/InstallCommand.ts';

export const fathymGreen: colors.Rgb = { r: 74, g: 145, b: 142 };

// TODO(mcgear): Check that minimum deno version is met

export type EaCRuntimeInstallerFlags = {
  help?: boolean,
  force?: boolean,
  tailwind?: boolean,
  twind?: boolean,
  vscode?: boolean,
  docker?: boolean,
};

const flags: EaCRuntimeInstallerFlags = parseArgs(Deno.args, {
  boolean: ['force', 'tailwind', 'twind', 'vscode', 'docker', 'help'],
  default: {
    force: undefined,
    tailwind: undefined,
    vscode: undefined,
    docker: undefined,
  },
  alias: {
    force: 'f',
    help: 'h',
  },
});

console.log();
console.log(colors.bgRgb24(' 🐙 EaC Runtime Installer ', fathymGreen));
console.log();

let command: Command | undefined;

if (flags.help) {
  command = new HelpCommand();
} else {
  command = new InstallCommand(flags);
}

if (command) {
  await command.Run();
}

Deno.exit(0);

import { HelpCommand } from './src/install/commands/HelpCommand.ts';
import { flags, command } from './install.ts';

if (flags.help) {
  command = new HelpCommand();
} else {
  command = new InstallCommand(flags);
}

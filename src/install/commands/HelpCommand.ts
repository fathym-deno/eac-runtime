import { Command } from './Command.ts';

export class HelpCommand implements Command {
  public Run(): Promise<void> {
    const helpText = `eac-runtime-installer

    Install a new EaC Runtime project. This will create all the necessary 
    files for a new project.
    
    To generate a project in the './foobar' subdirectory:
      eac-runtime-installer ./foobar
    
    To generate a project in the current directory:
      eac-runtime-installer .
    
    USAGE:
      eac-runtime-installer [DIRECTORY]
    
    OPTIONS:
        --force         Overwrite existing files
        --tailwind      Use Tailwind for styling
        --vscode        Setup project for VS Code
        --docker        Setup Project to use Docker
    `;

    console.log(helpText);

    return Promise.resolve();
  }
}

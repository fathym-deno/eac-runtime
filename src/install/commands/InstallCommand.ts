import { path } from '../install.deps.ts';
import { EaCRuntimeInstallerFlags } from '../../../install.ts';
import { Command } from './Command.ts';

export class InstallCommand implements Command {
  protected filesToCreate: [string, string][];

  constructor(protected flags: EaCRuntimeInstallerFlags) {
    this.filesToCreate = [['../files/.gitignore', './.gitignore']];
  }

  public async Run(): Promise<void> {
    console.log(`Installing Fathym's EaC Runtime...`);

    const installDirectory = path.resolve('.');

    if (this.flags.docker) {
      this.filesToCreate.push(['../files/DOCKERFILE', './DOCKERFILE']);
    }

    await this.ensureFilesCreated(installDirectory);

    await this.ensureDenoConfigCreated(installDirectory);
  }

  protected async copyTemplateFile(
    installDirectory: string,
    filePath: string,
    outputFilePath: string
  ): Promise<void> {
    const gitIgnoreFile = await this.openTemplateFile(filePath);

    const outputTo = path.join(installDirectory, outputFilePath);

    await Deno.writeFile(outputTo, gitIgnoreFile, {
      create: true,
    });
  }

  protected async ensureDenoConfigCreated(
    installDirectory: string
  ): Promise<void> {
    const config = {
      lock: false,
      tasks: {
        build:
          'deno task build:fmt && deno task build:lint && deno task build:main',
        'build:dev': 'deno run -A dev.ts build',
        'build:main': 'deno run -A main.ts build',
        'build:fmt': 'deno fmt',
        'build:lint': 'deno lint',
        deploy: 'deno task build && deno task test && ftm git',
        dev: 'deno run -A --watch=configs/,data/,routes/,src/,static/ dev.ts',
        start: 'deno run -A main.ts',
        test: 'deno test -A tests/tests.ts --coverage=cov',
      },
      lint: {
        rules: {
          tags: ['fresh', 'recommended'],
        },
      },
      exclude: ['**/_fresh/*'],
      imports: {
        '@fathym/eac/runtime': new URL("../../../mod.ts", import.meta.url).href,
      } as Record<string, string>,
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
      },
    };

    const configStr = JSON.stringify(config, null, 2) + '\n';

    await Deno.writeTextFile(
      path.join(installDirectory, 'deno.jsonc'),
      configStr
    );
  }

  protected async ensureFilesCreated(installDirectory: string): Promise<void> {
    for (const [inputFile, outputFile] of this.filesToCreate) {
      await this.copyTemplateFile(installDirectory, inputFile, outputFile);
    }
  }

  protected async openTemplateFile(
    filePath: string
  ): Promise<ReadableStream<Uint8Array>> {
    const fileUrl = new URL(filePath, import.meta.url);

    if (fileUrl.protocol.startsWith('http')) {
      const fileResp = await fetch(fileUrl, {
        headers: {
          'user-agent': 'Deno\\',
        },
      });

      return fileResp.body!;
    } else {
      const file = await Deno.open(fileUrl, {
        read: true,
      });

      return file.readable;
    }
  }
}

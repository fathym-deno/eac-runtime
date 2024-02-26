import { exists, loadEverythingAsCodeMetaUrl, merge, path } from '../install.deps.ts';
import { EaCRuntimeInstallerFlags } from '../../../install.ts';
import { Command } from './Command.ts';

export class InstallCommand implements Command {
  protected filesToCreate: [string, string][];

  constructor(protected flags: EaCRuntimeInstallerFlags) {
    this.filesToCreate = [
      ['../files/.gitignore', './.gitignore'],
      ['../files/dev.ts', './dev.ts'],
      ['../files/main.ts', './main.ts'],
      [
        '../files/configs/eac-runtime.config.ts',
        './configs/eac-runtime.config.ts',
      ],
    ];
  }

  public async Run(): Promise<void> {
    console.log(`Installing Fathym's EaC Runtime...`);

    const installDirectory = path.resolve('.');

    // TODO(mcgear): Verify no existing files

    if (this.flags.docker) {
      this.filesToCreate.push(['../files/DOCKERFILE', './DOCKERFILE']);
    }

    await this.ensureFilesCreated(installDirectory);

    await this.ensureDenoConfigCreated(installDirectory);
  }

  protected async copyTemplateFile(
    installDirectory: string,
    filePath: string,
    outputFilePath: string,
  ): Promise<void> {
    const outputTo = path.join(installDirectory, outputFilePath);

    const file = await this.openTemplateFile(filePath);

    const dir = await path.dirname(outputTo);

    if (!(await exists(dir))) {
      await Deno.mkdir(dir);
    }

    await Deno.writeFile(outputTo, file, {
      create: true,
    });
  }

  protected async ensureDenoConfigCreated(
    installDirectory: string,
  ): Promise<void> {
    const config = {
      lock: false,
      tasks: {
        build: 'deno task build:fmt && deno task build:lint && deno task build:main',
        'build:dev': 'deno run -A dev.ts build',
        'build:docker': 'docker build --no-cache .',
        'build:fmt': 'deno fmt',
        'build:lint': 'deno lint',
        'build:main': 'deno run -A main.ts build',
        deploy: 'deno task build && deno task test && ftm git',
        dev: 'deno run -A --watch=configs/,data/,routes/,src/,static/ dev.ts',
        start: 'deno run -A main.ts',
        test: 'deno test -A tests/tests.ts --coverage=cov',
      },
      lint: {
        rules: {
          tags: ['recommended'],
        },
      },
      exclude: ['**/_eac/*'],
      imports: {
        '@fathym/eac': loadEverythingAsCodeMetaUrl('../../mod.ts'),
        '@fathym/eac/runtime': import.meta.resolve('../../../mod.ts'),
        preact: 'https://esm.sh/preact@10.19.6',
        'preact/': 'https://esm.sh/preact@10.19.6/',
        'preact-render-to-string': 'https://esm.sh/*preact-render-to-string@6.4.0',
      } as Record<string, string>,
      unstable: ['kv'],
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
      },
    };

    if (this.flags.preact) {
      config.imports = merge(config.imports, {
        preact: 'https://esm.sh/preact@10.19.6',
        'preact/': 'https://esm.sh/preact@10.19.6/',
        'preact-render-to-string': 'https://esm.sh/*preact-render-to-string@6.4.0',
      });
    }

    const configStr = JSON.stringify(config, null, 2) + '\n';

    await Deno.writeTextFile(
      path.join(installDirectory, 'deno.jsonc'),
      configStr,
    );
  }

  protected async ensureFilesCreated(installDirectory: string): Promise<void> {
    for (const [inputFile, outputFile] of this.filesToCreate) {
      await this.copyTemplateFile(installDirectory, inputFile, outputFile);
    }
  }

  protected async openTemplateFile(
    filePath: string,
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

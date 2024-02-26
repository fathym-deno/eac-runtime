import {
  exists,
  loadEverythingAsCodeMetaUrl,
  mergeWithArrays,
  path,
  toText,
} from '../install.deps.ts';
import { EaCRuntimeInstallerFlags } from '../../../install.ts';
import { Command } from './Command.ts';

export class InstallCommand implements Command {
  protected filesToCreate: [string, string, ((contents: string) => string)?][];

  constructor(protected flags: EaCRuntimeInstallerFlags) {
    this.filesToCreate = [
      ['../files/.gitignore', './.gitignore'],
      ['../files/dev.ts', './dev.ts'],
      ['../files/main.ts', './main.ts'],
      [
        '../files/configs/eac-runtime.config.ts',
        './configs/eac-runtime.config.ts',
      ],
      [
        '../files/deno.template.jsonc',
        './deno.jsonc',
        (contents) => this.ensureDenoConfigSetup(contents),
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
  }

  protected async copyTemplateFile(
    installDirectory: string,
    filePath: string,
    outputFilePath: string,
    transformer?: (contents: string) => string,
  ): Promise<void> {
    const outputTo = path.join(installDirectory, outputFilePath);

    if (!(await exists(outputTo))) {
      const dir = await path.dirname(outputTo);

      if (!(await exists(dir))) {
        await Deno.mkdir(dir);
      }

      const file = await this.openTemplateFile(filePath);

      if (transformer) {
        const fileContents = await toText(file);

        const transformed = transformer(fileContents);

        await Deno.writeTextFile(outputTo, transformed, {
          append: false,
          create: true,
        });
      } else {
        await Deno.writeFile(outputTo, file, {
          append: false,
          create: true,
        });
      }
    } else {
      console.log(`Skipping file ${outputTo}, because it already exists.`);
    }
  }

  protected ensureDenoConfigSetup(contents: string): string {
    // Is there a Deno type that represents the configuration file?
    let config: Record<string, unknown> = JSON.parse(contents);

    config = mergeWithArrays(config, {
      imports: {
        '@fathym/eac': loadEverythingAsCodeMetaUrl('../../mod.ts'),
        '@fathym/eac/runtime': import.meta.resolve('../../../mod.ts'),
      },
    });

    if (this.flags.preact) {
      config = mergeWithArrays(config, {
        imports: {
          preact: 'https://esm.sh/preact@10.19.6',
          'preact/': 'https://esm.sh/preact@10.19.6/',
          'preact-render-to-string': 'https://esm.sh/*preact-render-to-string@6.4.0',
        },
        compilerOptions: {
          jsx: 'react-jsx',
          jsxImportSource: 'preact',
        },
      });
    }

    const configStr = JSON.stringify(config, null, 2) + '\n';

    return configStr;
  }

  protected async ensureFilesCreated(installDirectory: string): Promise<void> {
    for (const [inputFile, outputFile, transformer] of this.filesToCreate) {
      await this.copyTemplateFile(
        installDirectory,
        inputFile,
        outputFile,
        transformer,
      );
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

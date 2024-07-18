import {
  exists,
  existsSync,
  loadEverythingAsCodeMetaUrl,
  mergeWithArrays,
  path,
  toText,
} from '../install.deps.ts';
import { EaCRuntimeInstallerFlags } from '../../../install.ts';
import { Command } from './Command.ts';

export class InstallCommand implements Command {
  private fileSets: Record<string, typeof this.filesToCreate> = {
    api: [
      ['../files/README.md', './README.md'],
      ['../files/.gitignore', './.gitignore'],
      ['../files/dev.ts', './dev.ts'],
      ['../files/main.ts', './main.ts'],
      [
        '../files/deno.template.jsonc',
        './deno.jsonc',
        (contents: string) => this.ensureDenoConfigSetup(contents),
      ],
      ['../files/tests/tests.ts', './tests/tests.ts'],
      ['../files/tests/tests.deps.ts', './tests/tests.deps.ts'],
      [
        '../files/api/configs/eac-runtime.config.ts',
        './configs/eac-runtime.config.ts',
      ],
      [
        '../files/api/src/plugins/MyCoreRuntimePlugin.ts',
        './src/plugins/MyCoreRuntimePlugin.ts',
      ],
      [
        '../files/api/apps/api/[slug]/_middleware.ts',
        './apps/api/[slug]/_middleware.ts',
      ],
      [
        '../files/api/apps/api/[slug]/another.ts',
        './apps/api/[slug]/another.ts',
      ],
      ['../files/api/apps/api/_middleware.ts', './apps/api/_middleware.ts'],
      ['../files/api/apps/api/index.ts', './apps/api/index.ts'],
    ],
    core: [
      ['../files/README.md', './README.md'],
      ['../files/.gitignore', './.gitignore'],
      ['../files/dev.ts', './dev.ts'],
      ['../files/main.ts', './main.ts'],
      [
        '../files/deno.template.jsonc',
        './deno.jsonc',
        (contents: string) => this.ensureDenoConfigSetup(contents),
      ],
      ['../files/tests/tests.ts', './tests/tests.ts'],
      ['../files/tests/tests.deps.ts', './tests/tests.deps.ts'],
      [
        '../files/core/configs/eac-runtime.config.ts',
        './configs/eac-runtime.config.ts',
      ],
      [
        '../files/core/src/plugins/MyCoreRuntimePlugin.ts',
        './src/plugins/MyCoreRuntimePlugin.ts',
      ],
    ],
    demo: [
      ['../files/README.md', './README.md'],
      ['../files/.gitignore', './.gitignore'],
      ['../files/dev.ts', './dev.ts'],
      ['../files/main.ts', './main.ts'],
      [
        '../files/deno.template.jsonc',
        './deno.jsonc',
        (contents: string) => this.ensureDenoConfigSetup(contents),
      ],
      ['../files/tests/tests.ts', './tests/tests.ts'],
      ['../files/tests/tests.deps.ts', './tests/tests.deps.ts'],
      [
        '../files/demo/configs/eac-runtime.config.ts',
        './configs/eac-runtime.config.ts',
      ],
      [
        '../files/demo/apps/api/[slug]/_middleware.ts',
        './apps/api/[slug]/_middleware.ts',
      ],
      [
        '../files/demo/apps/api/[slug]/another.ts',
        './apps/api/[slug]/another.ts',
      ],
      ['../files/demo/apps/api/_middleware.ts', './apps/api/_middleware.ts'],
      ['../files/demo/apps/api/index.ts', './apps/api/index.ts'],
      [
        '../files/demo/apps/components/Button.tsx',
        './apps/components/Button.tsx',
      ],
      [
        '../files/demo/apps/components/Counter.tsx',
        './apps/components/Counter.tsx',
      ],
      ['../files/demo/apps/home/_layout.tsx', './apps/home/_layout.tsx'],
      ['../files/demo/apps/home/index.tsx', './apps/home/index.tsx'],
      ['../files/demo/apps/tailwind/styles.css', './apps/tailwind/styles.css'],
      [
        '../files/demo/apps/tailwind/tailwind.config.ts',
        './apps/tailwind/tailwind.config.ts',
      ],
    ],
    preact: [
      ['../files/README.md', './README.md'],
      ['../files/.gitignore', './.gitignore'],
      ['../files/dev.ts', './dev.ts'],
      ['../files/main.ts', './main.ts'],
      [
        '../files/deno.template.jsonc',
        './deno.jsonc',
        (contents: string) => this.ensureDenoConfigSetup(contents),
      ],
      ['../files/tests/tests.ts', './tests/tests.ts'],
      ['../files/tests/tests.deps.ts', './tests/tests.deps.ts'],
      [
        '../files/preact/src/plugins/MyCoreRuntimePlugin.ts',
        './src/plugins/MyCoreRuntimePlugin.ts',
      ],
      [
        '../files/preact/src/plugins/DefaultMyCoreProcessorHandlerResolver.ts',
        './src/plugins/DefaultMyCoreProcessorHandlerResolver.ts',
      ],
      [
        '../files/preact/configs/eac-runtime.config.ts',
        './configs/eac-runtime.config.ts',
      ],
      [
        '../files/preact/apps/components/Button.tsx',
        './apps/components/Button.tsx',
      ],
      [
        '../files/preact/apps/islands/Counter.tsx',
        './apps/islands/Counter.tsx',
      ],
      ['../files/preact/apps/home/_layout.tsx', './apps/home/_layout.tsx'],
      ['../files/preact/apps/home/index.tsx', './apps/home/index.tsx'],
      [
        '../files/preact/apps/tailwind/styles.css',
        './apps/tailwind/styles.css',
      ],
      ['../files/preact/tailwind.config.ts', './tailwind.config.ts'],
    ],
    synaptic: [
      ['../files/README.md', './README.md'],
      ['../files/.gitignore', './.gitignore'],
      ['../files/dev.ts', './dev.ts'],
      ['../files/main.ts', './main.ts'],
      [
        '../files/deno.template.jsonc',
        './deno.jsonc',
        (contents: string) => this.ensureDenoConfigSetup(contents),
      ],
      ['../files/synaptic/tests/tests.ts', './tests/tests.ts'],
      ['../files/synaptic/tests/tests.deps.ts', './tests/tests.deps.ts'],
      [
        '../files/synaptic/tests/test-eac-setup.ts',
        './tests/test-eac-setup.ts',
      ],
      [
        '../files/synaptic/tests/circuits/.tests.ts',
        './tests/circuits/.tests.ts',
      ],
      [
        '../files/synaptic/tests/circuits/simple-tool.tests.ts',
        './tests/circuits/simple-tool.tests.ts',
      ],
      [
        '../files/synaptic/configs/eac-runtime.config.ts',
        './configs/eac-runtime.config.ts',
      ],
      [
        '../files/synaptic/src/plugins/MyCoreRuntimePlugin.ts',
        './src/plugins/MyCoreRuntimePlugin.ts',
      ],
      [
        '../files/synaptic/src/plugins/MyCoreSynapticPlugin.ts',
        './src/plugins/MyCoreSynapticPlugin.ts',
      ],
      [
        '../files/synaptic/src/plugins/DefaultMyCoreProcessorHandlerResolver.ts',
        './src/plugins/DefaultMyCoreProcessorHandlerResolver.ts',
      ],
    ],
  };

  protected filesToCreate: [string, string, ((contents: string) => string)?][];

  constructor(protected flags: EaCRuntimeInstallerFlags) {
    this.filesToCreate = this.fileSets[flags.template ?? 'demo'];
  }

  public async Run(): Promise<void> {
    console.log(`Installing Fathym's EaC Runtime...`);

    const installDirectory = path.resolve('.');

    if (this.flags.docker) {
      this.filesToCreate.push(['../files/DOCKERFILE', './DOCKERFILE']);
    }

    if (this.flags.vscode) {
      this.filesToCreate.push([
        '../files/.vscode/extensions.json',
        './.vscode/extensions.json',
      ]);

      this.filesToCreate.push([
        '../files/.vscode/launch.json',
        './.vscode/launch.json',
      ]);

      this.filesToCreate.push([
        '../files/.vscode/settings.json',
        './.vscode/settings.json',
      ]);
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

      dir.split('\\').reduce((path, next) => {
        path.push(next);

        if (!existsSync(path.join('\\'))) {
          Deno.mkdirSync(path.join('\\'));
        }

        return path;
      }, new Array<string>());

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
        '@fathym/common': 'https://deno.land/x/fathym_common@v0.0.185/mod.ts',
        '@fathym/eac': loadEverythingAsCodeMetaUrl('../../mod.ts'),
        '@fathym/eac/runtime': import.meta.resolve('../../../mod.ts'),
        '@fathym/eac/runtime/': import.meta.resolve('../../../'),
        '@fathym/eac/runtime/browser': import.meta.resolve(
          '../../../browser.ts',
        ),
      },
    });

    if (
      this.flags.template === 'preact' ||
      this.flags.template === 'synaptic'
    ) {
      config = mergeWithArrays(config, {
        imports: {
          '@fathym/ioc': 'https://deno.land/x/fathym_ioc@v0.0.10/mod.ts',
        },
      });
    }

    if (this.flags.template === 'preact') {
      config = mergeWithArrays(config, {
        imports: {
          '@fathym/atomic': 'https://deno.land/x/fathym_atomic_design_kit@v0.0.134/mod.ts',
          '@fathym/atomic/': 'https://deno.land/x/fathym_atomic_design_kit@v0.0.134/',
          '@fathym/atomic-icons': 'https://deno.land/x/fathym_atomic_icons@v0.0.44/mod.ts',
          '@fathym/atomic-icons/browser':
            'https://deno.land/x/fathym_atomic_icons@v0.0.44/browser.ts',
          '@fathym/atomic-icons/plugin':
            'https://deno.land/x/fathym_atomic_icons@v0.0.44/plugin.ts',
        },
      });
    }

    if (this.flags.template === 'synaptic') {
      config = mergeWithArrays(config, {
        imports: {
          '@fathym/synaptic': 'https://deno.land/x/fathym_synaptic@v0.0.67/mod.ts',
          '@fathym/synaptic/': 'https://deno.land/x/fathym_synaptic@v0.0.67/',
        },
      });
    }

    if (this.flags.preact) {
      config = mergeWithArrays(config, {
        imports: {
          preact: 'https://esm.sh/preact@10.20.1',
          'preact/': 'https://esm.sh/preact@10.20.1/',
          'preact-render-to-string': 'https://esm.sh/*preact-render-to-string@6.4.0',
        },
        compilerOptions: {
          jsx: 'react-jsx',
          jsxImportSource: 'preact',
        },
      });
    }

    if (this.flags.tailwind) {
      config = mergeWithArrays(config, {
        imports: {
          tailwindcss: 'npm:tailwindcss@3.4.1',
          'tailwindcss/': 'npm:/tailwindcss@3.4.1/',
          'tailwindcss/plugin': 'npm:/tailwindcss@3.4.1/plugin.js',
          'tailwindcss/unimportant': 'npm:tailwindcss-unimportant@2.1.1',
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

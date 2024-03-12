import {
  denoPlugins,
  ESBuild,
  ESBuildOnLoadArgs,
  ESBuildOnLoadResult,
  ESBuildOnResolveArgs,
  ESBuildOnResolveResult,
  ESBuildOptions,
  ESBuildPlugin,
  jsonc,
  path,
} from '../src.deps.ts';
import { EAC_RUNTIME_DEV, IS_DENO_DEPLOY } from '../constants.ts';
import { DenoConfig } from './DenoConfig.ts';

export class EaCESBuilder {
  protected denoJson: DenoConfig;

  protected denoJsonPath: string;

  protected isDev: boolean;

  constructor(
    protected esbuild: ESBuild,
    protected entryPoints: string[],
    protected files: Record<string, string>,
    protected options: { external?: string[] } = {},
  ) {
    const absWorkingDir = Deno.cwd();

    this.denoJsonPath = path.join(absWorkingDir, './deno.jsonc');

    const denoJsonsStr = Deno.readTextFileSync(this.denoJsonPath);

    this.denoJson = jsonc.parse(denoJsonsStr) as DenoConfig;

    this.isDev = EAC_RUNTIME_DEV();
  }

  static ConfigurePlugin(builder: EaCESBuilder): ESBuildPlugin {
    return {
      name: 'EaCIslandsClientBuilder',
      setup(build) {
        build.onLoad({ filter: /.*/ }, (args) => {
          return builder.LoadFile(args);
        });
        build.onResolve({ filter: /.*/ }, (args) => {
          return builder.ResolveFile(args);
        });
      },
    } as ESBuildPlugin;
  }

  public async Build(options: Partial<ESBuildOptions> = {}) {
    const jsx = this.denoJson.compilerOptions?.jsx;

    const jsxImportSrc = this.denoJson.compilerOptions?.jsxImportSource;

    const minifyOptions: Partial<ESBuildOptions> = this.isDev
      ? {
        minifyIdentifiers: false,
        minifySyntax: false, //true,
        minifyWhitespace: false, //true,
      }
      : { minify: true };

    const bundle = await this.esbuild.build({
      entryPoints: this.entryPoints,
      absWorkingDir: IS_DENO_DEPLOY() ? Deno.cwd() : '/',
      platform: 'browser',
      format: 'esm',
      target: ['chrome99', 'firefox99', 'safari15'],
      jsx: jsx === 'react'
        ? 'transform'
        : jsx === 'react-native' || jsx === 'preserve'
        ? 'preserve'
        : !jsxImportSrc
        ? 'transform'
        : 'automatic',
      jsxImportSource: jsxImportSrc || 'preact',
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
      sourcemap: this.isDev ? 'linked' : false,
      outdir: '.',
      write: false,
      metafile: true,
      bundle: true,
      splitting: false, //true,
      treeShaking: false, //true,
      ...minifyOptions,
      plugins: [
        EaCESBuilder.ConfigurePlugin(this),
        //   devClientUrlPlugin(opts.basePath),
        //   buildIdPlugin(opts.buildID),
        ...denoPlugins({ configPath: this.denoJsonPath }),
      ],
      ...options,
    } as ESBuildOptions);

    return bundle;
  }

  public LoadFile(args: ESBuildOnLoadArgs): ESBuildOnLoadResult {
    if (args.namespace === '$') {
      const filePath = args.path;

      let contents = this.files[filePath];

      const loader = filePath.endsWith('.ts')
        ? 'ts'
        : filePath.endsWith('.tsx')
        ? 'tsx'
        : filePath.endsWith('.js')
        ? 'js'
        : filePath.endsWith('.jsx')
        ? 'jsx'
        : 'text';

      if (loader === 'tsx' || loader === 'jsx') {
        contents = `import { Fragment, h } from "preact";\n${contents}`;
      }

      return {
        contents,
        loader,
      };
    }

    return {
      contents: JSON.stringify('Hello World'.split(/\s+/)),
      loader: 'json',
    };
  }

  public ResolveFile(args: ESBuildOnResolveArgs): ESBuildOnResolveResult {
    let [path, namespace] = args.path.split('|');

    const importKeys = Object.keys(this.denoJson.imports || {});

    if (importKeys.includes(path)) {
      path = this.denoJson.imports![path];
    } else if (
      importKeys.some((imp) => imp.endsWith('/') && path.startsWith(imp))
    ) {
      const importPath = importKeys.find(
        (imp) => imp.endsWith('/') && path.startsWith(imp),
      )!;

      path = this.denoJson.imports![importPath] + path.replace(importPath, '');
    }

    if (
      path.startsWith('https://') ||
      path.startsWith('http://') ||
      this.options.external?.some((ext) => ext === path)
    ) {
      return { path: args.path, external: true };
    }

    return {
      path: path,
      namespace: namespace ?? '$',
    };
  }
}

import { BuildOptions, denoPlugins, esbuild, jsonc, path, Plugin } from '../../../src.deps.ts';
import { EAC_RUNTIME_DEV } from '../../../constants.ts';
import { DenoConfig } from '../../../utils/DenoConfig.ts';

export class EaCIslandsClientBuilder {
  protected denoJson: DenoConfig;

  protected denoJsonPath: string;

  protected isDev: boolean;

  constructor(
    protected entryPoints: string[],
    protected files: Record<string, string>,
  ) {
    const absWorkingDir = Deno.cwd();

    this.denoJsonPath = path.join(absWorkingDir, './deno.jsonc');

    const denoJsonsStr = Deno.readTextFileSync(this.denoJsonPath);

    this.denoJson = jsonc.parse(denoJsonsStr) as DenoConfig;

    this.isDev = EAC_RUNTIME_DEV();
  }

  static ConfigurePlugin(builder: EaCIslandsClientBuilder): Plugin {
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
    };
  }

  public async Build() {
    try {
      const jsx = this.denoJson.compilerOptions?.jsx;

      const jsxImportSrc = this.denoJson.compilerOptions?.jsxImportSource;

      const minifyOptions: Partial<BuildOptions> = this.isDev
        ? {
          minifyIdentifiers: false,
          minifySyntax: false, //true,
          minifyWhitespace: false, //true,
        }
        : { minify: true };

      const bundle = await esbuild.build({
        entryPoints: this.entryPoints,
        absWorkingDir: '/',
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
          EaCIslandsClientBuilder.ConfigurePlugin(this),
          //   devClientUrlPlugin(opts.basePath),
          //   buildIdPlugin(opts.buildID),
          ...denoPlugins({ configPath: this.denoJsonPath }),
        ],
      } as BuildOptions);

      return bundle;
    } finally {
      esbuild.stop();
    }
  }

  public LoadFile(args: esbuild.OnLoadArgs): esbuild.OnLoadResult {
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

  public ResolveFile(args: esbuild.OnResolveArgs): esbuild.OnResolveResult {
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

    if (path.startsWith('https://') || path.startsWith('http://')) {
      return { path: args.path, external: true };
    }

    return {
      path: path,
      namespace: namespace ?? '$',
    };
  }
}

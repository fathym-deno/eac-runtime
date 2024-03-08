import {
  autoprefixer,
  cssnano,
  path,
  postcss,
  TailwindConfig,
  tailwindCss,
} from '../../src.deps.ts';
import { AutoprefixerOptions } from './AutoprefixerOptions.ts';
import { EAC_RUNTIME_DEV } from '../../constants.ts';

export async function initTailwind(
  tailwindConfigPath: string,
  autoprefixerOptions: AutoprefixerOptions,
  allFiles: string[],
): Promise<postcss.Processor> {
  // const root = path.dirname(config.staticDir);

  const fullTailwindConfigPath = path.join(Deno.cwd(), tailwindConfigPath);

  const url = path.toFileUrl(fullTailwindConfigPath).href;

  const tailwindConfigSrc = (await import(url)).default;

  tailwindConfigSrc.content.push(
    ...allFiles.map((file) => {
      return { raw: file };
    }),
  );

  const tailwindConfig = tailwindConfigSrc as TailwindConfig;

  if (!Array.isArray(tailwindConfig.content)) {
    throw new Error(`Expected tailwind "content" option to be an array`);
  }

  tailwindConfig.content = tailwindConfig.content.map((pattern) => {
    if (typeof pattern === 'string') {
      const relative = path.relative(
        Deno.cwd(),
        path.dirname(tailwindConfigPath),
      );

      if (!relative.startsWith('..')) {
        return path.join(relative, pattern);
      }
    }
    return pattern;
  });

  // PostCSS types cause deep recursion
  const plugins = [
    // deno-lint-ignore no-explicit-any
    tailwindCss(tailwindConfig) as any,
    // deno-lint-ignore no-explicit-any
    autoprefixer(autoprefixerOptions) as any,
  ];

  if (!EAC_RUNTIME_DEV()) {
    plugins.push(cssnano());
  }

  return postcss(plugins);
}

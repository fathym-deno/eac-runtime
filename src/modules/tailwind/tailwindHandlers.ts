import { EaCTailwindProcessor } from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';
import { AutoprefixerOptions } from './AutoprefixerOptions.ts';

async function initTailwind(
  tailwindConfigPath: string,
  options: AutoprefixerOptions,
  allFiles: string[],
) {
  return await (
    await import('./compiler.ts')
  ).initTailwind(tailwindConfigPath, options, allFiles);
}

export async function establishTailwindHandlers(
  processor: EaCTailwindProcessor,
  allFiles: string[],
): Promise<EaCRuntimeHandler> {
  const autoprefixerOptions: AutoprefixerOptions = processor.AutoprefixerOptionsPath
    ? JSON.parse(await Deno.readTextFile(processor.AutoprefixerOptionsPath))
    : {};

  const stylesTemplate = processor.StylesTemplatePath
    ? await Deno.readTextFile(processor.StylesTemplatePath)
    : `@tailwind base;
@tailwind components;
@tailwind utilities;`;

  const tailwindReady = initTailwind(
    processor.ConfigPath || './tailwind.config.ts',
    autoprefixerOptions,
    allFiles,
  ).then((tailwindProcessor) => {
    return tailwindProcessor.process(stylesTemplate, {
      from: undefined,
    });
  });

  const { content, map } = await tailwindReady;

  return (_req, ctx) => {
    let resp: Response | Promise<Response>;

    if (ctx.Runtime.URLMatch.Path.endsWith('styles.css')) {
      resp = new Response(content, {
        headers: {
          'Content-Type': 'text/css',
        },
      });
    } else if (ctx.Runtime.URLMatch.Path.endsWith('styles.css.map')) {
      resp = Response.json(map);
    } else {
      throw new Deno.errors.NotFound(
        `Unable to handle the request for tailwind resources.`,
      );
    }

    return resp;
  };
}

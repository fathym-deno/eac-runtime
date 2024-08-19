import { EaCPreactAppProcessor, isEaCPreactAppProcessor, preactOptions } from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { PreactRenderHandler } from '../apps/preact/PreactRenderHandler.ts';
import { EaCPreactAppHandler } from '../../utils/EaCPreactAppHandler.ts';

export const EaCPreactAppProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    if (!isEaCPreactAppProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCPreactAppProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

    const handler = new EaCPreactAppHandler(
      ioc,
      new PreactRenderHandler(preactOptions),
      `./islands/client/eacIslandsClient.ts`,
      `./islands/client/client.deps.ts`,
      undefined,
      {
        outdir: Deno.cwd(),
      },
    );

    await handler.Configure(processor, eac.DFS || {}, Date.now());

    await handler.Build(
      processor,
      {},
      {},
    );

    return (req, ctx) => {
      // return pipeline.Execute(req, ctx);

      return handler.Execute(processor, req, ctx);
    };
  },
};

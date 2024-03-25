import {
  ComponentType,
  EaCDistributedFileSystem,
  EaCPreactAppProcessor,
  ESBuild,
  isEaCPreactAppProcessor,
  options as preactOptions,
} from '../../src.deps.ts';
import { importDFSTypescriptModule } from '../../utils/dfs/importDFSTypescriptModule.ts';
import { loadLayout } from '../apps/loadLayout.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { loadFileHandler } from '../../utils/dfs/loadFileHandler.ts';
import { loadMiddleware } from '../../utils/dfs/loadMiddleware.ts';
import { loadRequestPathPatterns } from '../../utils/dfs/loadRequestPathPatterns.ts';
import { loadPreactAppHandler } from '../apps/loadPreactAppHandler.ts';
import { PreactRenderHandler } from '../apps/preact/PreactRenderHandler.ts';
import { EaCESBuilder } from '../../utils/EaCESBuilder.ts';
import { loadClientScript } from '../apps/islands/loadClientScript.ts';
import { executePathMatch } from '../../utils/dfs/executePathMatch.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EaCRuntimeHandlerPipeline } from '../EaCRuntimeHandlerPipeline.ts';
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

    await handler.Build(processor, undefined, {});

    return (req, ctx) => {
      // return pipeline.Execute(req, ctx);

      return handler.Execute(processor, req, ctx);
    };
  },
};

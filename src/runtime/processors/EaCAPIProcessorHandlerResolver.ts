import { EaCAPIProcessor, isEaCAPIProcessor } from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { filesReadyCheck } from '../../utils/dfs/filesReadyCheck.ts';
import { loadRequestPathPatterns } from '../../utils/dfs/loadRequestPathPatterns.ts';
import { loadEaCRuntimeHandlers } from '../../utils/dfs/loadEaCRuntimeHandlers.ts';
import { executePathMatch } from '../../utils/dfs/executePathMatch.ts';

export const EaCAPIProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(ioc, appProcCfg) {
    if (!isEaCAPIProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCAPIProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCAPIProcessor;

    const patternsReady = filesReadyCheck(ioc, processor.DFS).then(
      (fileHandler) => {
        return loadRequestPathPatterns(
          fileHandler,
          processor.DFS,
          loadEaCRuntimeHandlers,
        ).then((patterns) => {
          console.log(patterns.map((p) => p.PatternText));

          return patterns;
        });
      },
    );

    patternsReady.then();

    return Promise.resolve(async (req, ctx) => {
      const patterns = await patternsReady;

      const resp = await executePathMatch(
        patterns,
        req,
        ctx,
        processor.DefaultContentType,
      );

      return resp;
    });
  },
};

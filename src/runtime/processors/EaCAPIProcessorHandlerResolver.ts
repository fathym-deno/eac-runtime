import { EaCAPIProcessor, ESBuild, isEaCAPIProcessor } from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { filesReadyCheck } from '../../utils/dfs/filesReadyCheck.ts';
import { loadMiddleware } from '../../utils/dfs/loadMiddleware.ts';
import { loadRequestPathPatterns } from '../../utils/dfs/loadRequestPathPatterns.ts';
import { loadEaCRuntimeHandlers } from '../../utils/dfs/loadEaCRuntimeHandlers.ts';
import { executePathMatch } from '../../utils/dfs/executePathMatch.ts';

export const EaCAPIProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    if (!isEaCAPIProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCAPIProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCAPIProcessor;

    const dfs = eac.DFS![processor.DFSLookup];

    const esbuild = await ioc.Resolve<ESBuild>(ioc.Symbol('ESBuild'));

    const patternsReady = filesReadyCheck(ioc, dfs).then((fileHandler) => {
      return loadRequestPathPatterns(
        fileHandler,
        dfs,
        async (allPaths) => {
          const middlewareLoader = async () => {
            const middlewarePaths = allPaths
              .filter((p) => p.endsWith('_middleware.ts'))
              .sort((a, b) => a.split('/').length - b.split('/').length);

            const middlewareCalls = middlewarePaths.map((p) => {
              return loadMiddleware(esbuild, fileHandler, p, dfs);
            });

            return await Promise.all(middlewareCalls);
          };

          const [middleware] = await Promise.all([middlewareLoader()]);

          console.log('Middleware: ');
          console.log(middleware.map((m) => m[0]));
          console.log();

          return { middleware };
        },
        async (filePath) => {
          return await loadEaCRuntimeHandlers(
            esbuild,
            fileHandler,
            filePath,
            dfs,
          );
        },
        (filePath, pipeline, { middleware }) => {
          const reqMiddleware = middleware
            .filter(([root]) => {
              return filePath.startsWith(root);
            })
            .flatMap(([_root, handler]) => Array.isArray(handler) ? handler : [handler]);

          pipeline.Prepend(...reqMiddleware);
        },
        appProcCfg.Revision,
      ).then((patterns) => {
        console.log('APIs: ');
        console.log(patterns.map((p) => p.PatternText));
        console.log();

        return patterns;
      });
    });

    patternsReady.then();

    return async (req, ctx) => {
      const patterns = await patternsReady;

      const resp = await executePathMatch(
        patterns,
        req,
        ctx,
        processor.DefaultContentType,
      );

      return resp;
    };
  },
};

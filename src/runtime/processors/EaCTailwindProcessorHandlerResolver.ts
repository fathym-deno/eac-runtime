import { EaCTailwindProcessor, isEaCTailwindProcessor, toText } from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { filesReadyCheck } from '../../utils/dfs/filesReadyCheck.ts';
import { establishTailwindHandlers } from '../../modules/tailwind/tailwindHandlers.ts';

export const EaCTailwindProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    if (!isEaCTailwindProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCTailwindProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCTailwindProcessor;

    const dfss = processor.DFSLookups.map((dfsLookup) => eac.DFS![dfsLookup]);

    const dfsCalls = dfss.map(async (dfs) => {
      const fileHandler = await filesReadyCheck(ioc, dfs);

      const allPaths = await fileHandler.LoadAllPaths(appProcCfg.Revision);

      const pathLoaderCalls = allPaths.map((path) => {
        return fileHandler.GetFileInfo(path, appProcCfg.Revision);
      });

      const files = await Promise.all(pathLoaderCalls);

      return await Promise.all(files.filter((f) => f).map((file) => toText(file!.Contents)));
    });

    const handlers = await Promise.all(dfsCalls)
      .then((fileContents) => {
        return fileContents.flatMap((fc) => fc);
      })
      .then((allFiles) => {
        return establishTailwindHandlers(processor, allFiles);
      });

    return (req, ctx) => {
      return handlers(req, ctx);
    };
  },
};

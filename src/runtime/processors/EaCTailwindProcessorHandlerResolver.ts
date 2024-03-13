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

    const handlers = await Promise.all(
      dfss.map((dfs) =>
        filesReadyCheck(ioc, dfs).then((fileHandler) => {
          return fileHandler
            .LoadAllPaths(appProcCfg.Revision)
            .then((allPaths) => {
              return Promise.all(
                allPaths.map((path) => fileHandler.GetFileInfo(path, appProcCfg.Revision)),
              ).then((files) => {
                return Promise.all(files.map((file) => toText(file.Contents)));
              });
            });
        })
      ),
    )
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

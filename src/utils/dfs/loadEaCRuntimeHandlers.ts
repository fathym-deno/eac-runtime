import { EaCDistributedFileSystemDetails, ESBuild } from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { importDFSTypescriptModule } from './importDFSTypescriptModule.ts';

export async function loadEaCRuntimeHandlers(
  esbuild: ESBuild,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystemDetails,
  dfsLookup: string,
): Promise<EaCRuntimeHandlerResult | undefined> {
  const apiModule = await importDFSTypescriptModule(
    esbuild,
    fileHandler,
    filePath,
    dfs,
    dfsLookup,
    'ts',
  );

  if (apiModule) {
    const handlers = apiModule.module.handler as EaCRuntimeHandlerResult;

    const defaultHandlers = apiModule.module.default as EaCRuntimeHandlerResult;

    return handlers || defaultHandlers;
    // const pipeline = new EaCRuntimeHandlerPipeline();

    // console.log(filePath);
    // console.log(pipeline.pipeline);
    // pipeline.Append(handlers, defaultHandlers);
    // console.log(pipeline.pipeline);

    // return (req, ctx) => pipeline.Execute(req, ctx);
  } else {
    return undefined;
  }
}

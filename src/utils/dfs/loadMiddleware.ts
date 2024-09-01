import { EaCDistributedFileSystemDetails, ESBuild } from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { loadEaCRuntimeHandlers } from './loadEaCRuntimeHandlers.ts';

export async function loadMiddleware(
  esbuild: ESBuild,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystemDetails,
  dfsLookup: string,
): Promise<[string, EaCRuntimeHandlerResult] | undefined> {
  const handler = await loadEaCRuntimeHandlers(
    esbuild,
    fileHandler,
    filePath,
    dfs,
    dfsLookup,
  );

  if (handler) {
    const root = filePath.replace('_middleware.ts', '');

    return [root, handler];
  } else {
    return undefined;
  }
}

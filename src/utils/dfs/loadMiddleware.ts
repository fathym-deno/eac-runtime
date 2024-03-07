import { EaCDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { loadEaCRuntimeHandlers } from './loadEaCRuntimeHandlers.ts';

export async function loadMiddleware(
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
): Promise<[string, EaCRuntimeHandlerResult]> {
  const handler = await loadEaCRuntimeHandlers(fileHandler, filePath, dfs);

  const root = filePath.replace('_middleware.ts', '');

  return [root, handler];
}

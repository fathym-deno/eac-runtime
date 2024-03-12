import { EaCDistributedFileSystem, ESBuild } from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { EaCRuntimeHandlers } from '../../runtime/EaCRuntimeHandlers.ts';
import { importDFSTypescriptModule } from './importDFSTypescriptModule.ts';

export async function loadEaCRuntimeHandlers(
  esbuild: ESBuild,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
): Promise<EaCRuntimeHandlerResult> {
  const apiModule = await importDFSTypescriptModule(esbuild, fileHandler, filePath, dfs, 'ts');

  const handlers = apiModule.module.default as EaCRuntimeHandlers;

  return handlers;
}

import { EaCDistributedFileSystem, IoCContainer } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from '../../runtime/dfs/DFSFileHandlerResolver.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';

export async function loadFileHandler(
  ioc: IoCContainer,
  dfs: EaCDistributedFileSystem,
): Promise<DFSFileHandler | undefined> {
  const defaultDFSFileHandlerResolver = await ioc.Resolve<DFSFileHandlerResolver>(
    ioc.Symbol('DFSFileHandler'),
  );

  const fileHandler = await defaultDFSFileHandlerResolver.Resolve(ioc, dfs);

  return fileHandler;
}

import { EaCLocalDistributedFileSystem, isEaCLocalDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildLocalDFSFileHandler } from './buildLocalDFSFileHandler.ts';

export const EaCLocalDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  Resolve(_ioc, dfs) {
    if (!isEaCLocalDistributedFileSystem(dfs)) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCLocalDistributedFileSystemHandlerResolver.',
      );
    }

    const localDFS = dfs as EaCLocalDistributedFileSystem;

    return Promise.resolve(buildLocalDFSFileHandler(localDFS.FileRoot));
  },
};

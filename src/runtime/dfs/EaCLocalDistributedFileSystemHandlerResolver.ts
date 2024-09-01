import { isEaCLocalDistributedFileSystemDetails } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildLocalDFSFileHandler } from './buildLocalDFSFileHandler.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';

export const EaCLocalDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  Resolve(_ioc, dfs): Promise<DFSFileHandler | undefined> {
    if (!isEaCLocalDistributedFileSystemDetails(dfs)) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCLocalDistributedFileSystemHandlerResolver.',
      );
    }

    return Promise.resolve(buildLocalDFSFileHandler(dfs.FileRoot));
  },
};

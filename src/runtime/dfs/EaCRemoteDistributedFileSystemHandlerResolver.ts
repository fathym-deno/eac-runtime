import { isEaCRemoteDistributedFileSystemDetails } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildFetchDFSFileHandler } from './buildFetchDFSFileHandler.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';

export const EaCRemoteDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  Resolve(_ioc, dfs): Promise<DFSFileHandler | undefined> {
    if (!isEaCRemoteDistributedFileSystemDetails(dfs)) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCRemoteDistributedFileSystemHandlerResolver.',
      );
    }

    const fileRoot = new URL(dfs.RemoteRoot);

    return Promise.resolve(buildFetchDFSFileHandler(fileRoot.href));
  },
};

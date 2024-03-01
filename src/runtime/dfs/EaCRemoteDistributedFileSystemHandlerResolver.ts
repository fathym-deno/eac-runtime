import { isEaCRemoteDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildFetchDFSFileHandler } from './buildFetchDFSFileHandler.ts';

export const EaCRemoteDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  Resolve(_ioc, dfs) {
    if (!isEaCRemoteDistributedFileSystem(dfs)) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCRemoteDistributedFileSystemHandlerResolver.',
      );
    }

    const fileRoot = new URL(dfs.RemoteRoot);

    return Promise.resolve(buildFetchDFSFileHandler(fileRoot.href));
  },
};

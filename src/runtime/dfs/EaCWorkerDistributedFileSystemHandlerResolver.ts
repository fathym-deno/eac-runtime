import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildWorkerDFSFileHandler } from '@fathym/eac/runtime/src/runtime/dfs/buildWorkerDFSFileHandler.ts';

export const EaCWorkerDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  Resolve(_ioc, dfs) {
    if (!dfs.WorkerPath) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCWorkerDistributedFileSystemHandlerResolver.',
      );
    }

    return Promise.resolve(buildWorkerDFSFileHandler(dfs));
  },
};

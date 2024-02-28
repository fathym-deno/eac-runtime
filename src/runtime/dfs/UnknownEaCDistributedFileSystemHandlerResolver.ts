import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildLocalDFSFileHandler } from './buildLocalDFSFileHandler.ts';

export const UnknownEaCDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  Resolve(_ioc, _dfs) {
    return Promise.resolve(buildLocalDFSFileHandler('.'));
  },
};

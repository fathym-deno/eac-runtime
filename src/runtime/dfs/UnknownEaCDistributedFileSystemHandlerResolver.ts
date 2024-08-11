import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildLocalDFSFileHandler } from './buildLocalDFSFileHandler.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';

export const UnknownEaCDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  Resolve(_ioc, _dfs): Promise<DFSFileHandler | undefined> {
    return Promise.resolve(buildLocalDFSFileHandler('.'));
  },
};

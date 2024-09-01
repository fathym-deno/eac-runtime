import { EaCDistributedFileSystemDetails, IoCContainer } from '../../src.deps.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';

export type DFSFileHandlerResolver = {
  Resolve: (
    ioc: IoCContainer,
    dfs: EaCDistributedFileSystemDetails,
  ) => Promise<DFSFileHandler | undefined>;
};

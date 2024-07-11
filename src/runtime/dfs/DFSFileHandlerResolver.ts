import { EaCDistributedFileSystem, IoCContainer } from '../../src.deps.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';

export type DFSFileHandlerResolver = {
  Resolve: (
    ioc: IoCContainer,
    dfs: EaCDistributedFileSystem,
  ) => Promise<DFSFileHandler | undefined>;
};

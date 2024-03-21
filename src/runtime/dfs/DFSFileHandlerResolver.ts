import { EaCDistributedFileSystem, IoCContainer } from '../../src.deps.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';

export type DFSFileHandlerResolver = {
  Resolve: (
    ioc: IoCContainer,
    modifier: EaCDistributedFileSystem,
  ) => Promise<DFSFileHandler | undefined>;
};

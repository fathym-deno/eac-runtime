import { isEaCLocalDistributedFileSystem, isEaCNPMDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';

export const defaultDFSFileHandlerResolver: DFSFileHandlerResolver = {
  async Resolve(ioc, dfs) {
    let toResolveName: string = '';

    if (isEaCNPMDistributedFileSystem(dfs)) {
      toResolveName = 'EaCNPMDistributedFileSystem';
    } else if (isEaCLocalDistributedFileSystem(dfs)) {
      toResolveName = 'EaCLocalDistributedFileSystem';
    } else {
      toResolveName = 'UnknownEaCDistributedFileSystem';
    }

    const resolver = await ioc.Resolve<DFSFileHandlerResolver>(
      ioc.Symbol('DFSFileHandlerResolver'),
      toResolveName,
    );

    return await resolver.Resolve(ioc, dfs);
  },
};

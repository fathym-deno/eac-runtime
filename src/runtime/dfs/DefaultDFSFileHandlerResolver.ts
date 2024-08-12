import {
  EaCDistributedFileSystem,
  IoCContainer,
  isEaCDenoKVDistributedFileSystem,
  isEaCESMDistributedFileSystem,
  isEaCJSRDistributedFileSystem,
  isEaCLocalDistributedFileSystem,
  isEaCNPMDistributedFileSystem,
  isEaCRemoteDistributedFileSystem,
} from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';

export class DefaultDFSFileHandlerResolver implements DFSFileHandlerResolver {
  public async Resolve(
    ioc: IoCContainer,
    dfs: EaCDistributedFileSystem,
  ): Promise<DFSFileHandler | undefined> {
    let toResolveName: string = '';

    if (dfs.WorkerPath) {
      toResolveName = 'EaCWorkerDistributedFileSystem';
    } else if (isEaCDenoKVDistributedFileSystem(dfs)) {
      toResolveName = 'EaCDenoKVDistributedFileSystem';
    } else if (isEaCESMDistributedFileSystem(dfs)) {
      toResolveName = 'EaCESMDistributedFileSystem';
    } else if (isEaCJSRDistributedFileSystem(dfs)) {
      toResolveName = 'EaCJSRDistributedFileSystem';
    } else if (isEaCLocalDistributedFileSystem(dfs)) {
      toResolveName = 'EaCLocalDistributedFileSystem';
    } else if (isEaCNPMDistributedFileSystem(dfs)) {
      toResolveName = 'EaCNPMDistributedFileSystem';
    } else if (isEaCRemoteDistributedFileSystem(dfs)) {
      toResolveName = 'EaCRemoteDistributedFileSystem';
    } else {
      toResolveName = 'UnknownEaCDistributedFileSystem';
    }

    const resolver = await ioc.Resolve<DFSFileHandlerResolver>(
      ioc.Symbol('DFSFileHandler'),
      toResolveName,
    );

    return await resolver.Resolve(ioc, dfs);
  }
}

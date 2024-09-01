import {
  EaCDistributedFileSystemDetails,
  IoCContainer,
  isEaCDenoKVDistributedFileSystemDetails,
  isEaCESMDistributedFileSystemDetails,
  isEaCJSRDistributedFileSystemDetails,
  isEaCLocalDistributedFileSystemDetails,
  isEaCNPMDistributedFileSystemDetails,
  isEaCRemoteDistributedFileSystemDetails,
} from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';

export class DefaultDFSFileHandlerResolver implements DFSFileHandlerResolver {
  public async Resolve(
    ioc: IoCContainer,
    dfs: EaCDistributedFileSystemDetails,
  ): Promise<DFSFileHandler | undefined> {
    let toResolveName: string = '';

    if (dfs.WorkerPath) {
      toResolveName = 'EaCWorkerDistributedFileSystem';
    } else if (isEaCDenoKVDistributedFileSystemDetails(dfs)) {
      toResolveName = 'EaCDenoKVDistributedFileSystem';
    } else if (isEaCESMDistributedFileSystemDetails(dfs)) {
      toResolveName = 'EaCESMDistributedFileSystem';
    } else if (isEaCJSRDistributedFileSystemDetails(dfs)) {
      toResolveName = 'EaCJSRDistributedFileSystem';
    } else if (isEaCLocalDistributedFileSystemDetails(dfs)) {
      toResolveName = 'EaCLocalDistributedFileSystem';
    } else if (isEaCNPMDistributedFileSystemDetails(dfs)) {
      toResolveName = 'EaCNPMDistributedFileSystem';
    } else if (isEaCRemoteDistributedFileSystemDetails(dfs)) {
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

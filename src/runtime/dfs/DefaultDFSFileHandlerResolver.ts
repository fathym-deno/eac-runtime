import {
  EaCDistributedFileSystem,
  IoCContainer,
  isEaCDenoKVDistributedFileSystem,
  isEaCLocalDistributedFileSystem,
  isEaCNPMDistributedFileSystem,
  isEaCRemoteDistributedFileSystem,
} from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';

export class DefaultDFSFileHandlerResolver implements DFSFileHandlerResolver {
  public async Resolve(ioc: IoCContainer, dfs: EaCDistributedFileSystem) {
    let toResolveName: string = '';

    if (isEaCDenoKVDistributedFileSystem(dfs)) {
      toResolveName = 'EaCDenoKVDistributedFileSystem';
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

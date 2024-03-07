import { isEaCDenoKVDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildDenoKVDFSFileHandler } from './buildDenoKVDFSFileHandler.ts';

export const EaCDenoKVDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  async Resolve(ioc, dfs) {
    if (!isEaCDenoKVDistributedFileSystem(dfs)) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCDenoKVDistributedFileSystemHandlerResolver.',
      );
    }

    const denoKv = await ioc.Resolve(Deno.Kv, dfs.DatabaseLookup);

    return buildDenoKVDFSFileHandler(
      denoKv,
      dfs.RootKey || ['DFS'],
      dfs.FileRoot,
    );
  },
};

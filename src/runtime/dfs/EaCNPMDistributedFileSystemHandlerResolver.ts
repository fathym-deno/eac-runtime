import { EaCNPMDistributedFileSystem, isEaCNPMDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildFetchDFSFileHandler } from './buildFetchDFSFileHandler.ts';

export const EaCNPMDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  Resolve(_ioc, dfs) {
    if (!isEaCNPMDistributedFileSystem(dfs)) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCNPMDistributedFileSystemHandlerResolver.',
      );
    }

    const npmDFS = dfs as EaCNPMDistributedFileSystem;

    const fileRoot = new URL(
      `${npmDFS.Package}/`,
      'https://cdn.skypack.dev/',
    );

    return Promise.resolve(buildFetchDFSFileHandler(fileRoot.href));
  },
};

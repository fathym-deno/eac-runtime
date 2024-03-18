import { denoGraph, isEaCESMDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildFetchDFSFileHandler } from './buildFetchDFSFileHandler.ts';

export const EaCESMDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  Resolve(_ioc, dfs) {
    if (!isEaCESMDistributedFileSystem(dfs)) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCESMDistributedFileSystemHandlerResolver.',
      );
    }

    const esmDFSResolver = buildFetchDFSFileHandler(dfs.Root);

    esmDFSResolver.LoadAllPaths = async (_revision: number) => {
      const roots = dfs.EntryPoints.map((ep) => new URL(ep, dfs.Root).href);

      const graph = await denoGraph.createGraph(roots, {});

      const modules: { specifier: string }[] = graph.modules;

      return modules
        .filter(
          (m) => dfs.IncludeDependencies || m.specifier.startsWith(dfs.Root),
        )
        .map((m) => {
          let filePath = m.specifier;

          if (!dfs.IncludeDependencies) {
            filePath = filePath.replace(dfs.Root, '');

            if (filePath.startsWith('/')) {
              filePath = filePath.substring(1);
            }

            filePath = `./${filePath}`;
          }

          return filePath;
        });
    };

    return Promise.resolve(esmDFSResolver);
  },
};

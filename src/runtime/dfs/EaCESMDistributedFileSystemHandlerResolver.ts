import { denoGraph, isEaCESMDistributedFileSystem, path } from '../../src.deps.ts';
import { loadDenoConfig } from '../../utils/loadDenoConfig.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildFetchDFSFileHandler } from './buildFetchDFSFileHandler.ts';

export const EaCESMDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  async Resolve(_ioc, dfs) {
    if (!isEaCESMDistributedFileSystem(dfs)) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCESMDistributedFileSystemHandlerResolver.',
      );
    }

    let root = dfs.Root;

    const denoCfg = await loadDenoConfig();

    const importKeys = Object.keys(denoCfg.imports || {});

    if (importKeys.some((imp) => imp.endsWith('/') && root.startsWith(imp))) {
      const importRoot = importKeys.find(
        (imp) => imp.endsWith('/') && root.startsWith(imp),
      )!;

      root = denoCfg.imports![importRoot] + root.replace(importRoot, '');
    }

    const esmDFSResolver = buildFetchDFSFileHandler(root);

    esmDFSResolver.LoadAllPaths = async (_revision: number) => {
      console.log('Loading all ESM files...');

      let epRoot = root;

      if (epRoot.startsWith('./') || epRoot.startsWith('../')) {
        epRoot = `file:///${path.resolve(Deno.cwd(), epRoot)}\\`;
      }

      const roots = dfs.EntryPoints.map((ep) => new URL(ep, epRoot).href);

      const graph = await denoGraph.createGraph(roots, {});

      const modules: { specifier: string }[] = graph.modules;

      return modules
        .filter(
          (m) => dfs.IncludeDependencies || m.specifier.startsWith(epRoot),
        )
        .map((m) => {
          let filePath = m.specifier;

          if (!dfs.IncludeDependencies) {
            filePath = filePath.replace(epRoot, '');

            if (filePath.startsWith('/')) {
              filePath = filePath.substring(1);
            }

            filePath = `./${filePath}`;
          }

          return filePath;
        });
    };

    return esmDFSResolver;
  },
};

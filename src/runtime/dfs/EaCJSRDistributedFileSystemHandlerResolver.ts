import { getPackageLogger, isEaCJSRDistributedFileSystemDetails } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildFetchDFSFileHandler } from './buildFetchDFSFileHandler.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';

export const EaCJSRDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  async Resolve(_ioc, dfs): Promise<DFSFileHandler | undefined> {
    if (!isEaCJSRDistributedFileSystemDetails(dfs)) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCJSRDistributedFileSystemHandlerResolver.',
      );
    }

    const pkgRoot = new URL(`${dfs.Package}/`, 'https://jsr.io/');

    if (!dfs.Version) {
      const metaPath = new URL(`meta.json`, pkgRoot);

      const metaResp = await fetch(metaPath);

      const meta = (await metaResp.json()) as {
        latest: string;
      };

      dfs.Version = meta.latest;
    }

    const fileRoot = new URL(`${dfs.Version}/`, pkgRoot);

    const handler = buildFetchDFSFileHandler(fileRoot.href);

    handler.LoadAllPaths = async (_revision: number) => {
      const logger = await getPackageLogger();

      const metaPath = `${fileRoot.href.slice(0, -1)}_meta.json`;

      const metaResp = await fetch(metaPath);

      try {
        const meta = (await metaResp.clone().json()) as {
          manifest: { [filePath: string]: unknown };
        };

        const filePaths = Object.keys(meta.manifest);

        return filePaths;
      } catch (err) {
        logger.error(
          `There was an error loading paths for: ${metaPath}`,
          await metaResp.clone().text(),
        );

        throw err;
      }
    };

    return handler;
  },
};

import { isEaCJSRDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandlerResolver } from './DFSFileHandlerResolver.ts';
import { buildFetchDFSFileHandler } from './buildFetchDFSFileHandler.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';

export const EaCJSRDistributedFileSystemHandlerResolver: DFSFileHandlerResolver = {
  Resolve(_ioc, dfs): Promise<DFSFileHandler | undefined> {
    if (!isEaCJSRDistributedFileSystem(dfs)) {
      throw new Deno.errors.NotSupported(
        'The provided dfs is not supported for the EaCJSRDistributedFileSystemHandlerResolver.',
      );
    }

    const fileRoot = new URL(
      `${dfs.Package}/${dfs.Version}/`,
      'https://jsr.io/',
    );

    const handler = buildFetchDFSFileHandler(fileRoot.href);

    handler.LoadAllPaths = async (_revision: number) => {
      const metaPath = `${fileRoot.href}__meta.json`;

      const metaResp = await fetch(metaPath);

      const meta = (await metaResp.json()) as {
        manifest: { [filePath: string]: unknown };
      };

      const filePaths = Object.keys(meta.manifest);

      return filePaths;
    };

    return Promise.resolve(handler);
  },
};

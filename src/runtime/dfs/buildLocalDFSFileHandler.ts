import { existsSync, getFilesList, path } from '../../src.deps.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';
import { DFSFileInfo } from './DFSFileInfo.ts';
import { getFileCheckPathsToProcess } from './getFileCheckPathsToProcess.ts';
import { withDFSCache } from './withDFSCache.ts';

export const buildLocalDFSFileHandler = (
  root: string,
  pathResolver?: (filePath: string) => string,
): DFSFileHandler => {
  return {
    async GetFileInfo(
      filePath: string,
      revision: number,
      defaultFileName?: string,
      extensions?: string[],
      useCascading?: boolean,
      cacheDb?: Deno.Kv,
      cacheSeconds?: number,
    ): Promise<DFSFileInfo> {
      let finalFilePath = filePath;

      return await withDFSCache(
        finalFilePath,
        async () => {
          const fileCheckPaths = getFileCheckPathsToProcess(
            filePath,
            defaultFileName,
            extensions,
            useCascading,
          );

          const fileChecks: Promise<Deno.FsFile | undefined>[] = [];

          fileCheckPaths.forEach((fcp) => {
            const resolvedPath = pathResolver ? pathResolver(fcp) : fcp;

            if (resolvedPath) {
              const fullFilePath = path.join(root || '', resolvedPath);

              if (existsSync(fullFilePath)) {
                fileChecks.push(
                  new Promise<Deno.FsFile | undefined>((resolve) => {
                    Deno.open(fullFilePath, {
                      read: true,
                    })
                      .then(resolve)
                      .catch(() => resolve(undefined));
                  }),
                );
              }
            }
          });

          const fileResps = await Promise.all(fileChecks);

          const activeFileResp = fileResps.find((fileResp, i) => {
            finalFilePath = fileCheckPaths[i];

            return fileResp;
          });

          if (activeFileResp) {
            const dfsFileInfo: DFSFileInfo = {
              Contents: activeFileResp.readable,
              Path: finalFilePath,
            };

            return dfsFileInfo;
          } else if (defaultFileName) {
            throw new Error(
              `Unable to locate a local file at path ${filePath}, and no default file was found for ${defaultFileName}.`,
            );
          } else {
            throw new Error(
              `Unable to locate a local file at path ${filePath}.`,
            );
          }
        },
        revision,
        cacheDb,
        cacheSeconds,
      );
    },

    async LoadAllPaths(): Promise<string[]> {
      const dir = await getFilesList({
        Directory: root,
      });

      const paths: string[] = [];

      for await (const entry of dir) {
        paths.push(`./${entry.substring(root.length)}`);
      }

      return paths;
    },
  };
};

import { existsSync, path } from '../../src.deps.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';
import { DFSFileInfo } from './DFSFileInfo.ts';
import { getFileCheckPathsToProcess } from './getFileCheckPathsToProcess.ts';

export const buildLocalDFSFileHandler = (
  root: string,
  pathResolver?: (filePath: string) => string,
): DFSFileHandler => {
  return {
    async GetFileInfo(
      filePath: string,
      defaultFileName?: string,
    ): Promise<DFSFileInfo> {
      const fileCheckPaths = getFileCheckPathsToProcess(
        filePath,
        defaultFileName,
      );

      const fileChecks: Promise<Deno.FsFile>[] = [];

      fileCheckPaths.forEach((fcp) => {
        const resolvedPath = pathResolver ? pathResolver(fcp) : fcp;

        if (resolvedPath) {
          const fullFilePath = path.join(root || '', resolvedPath);

          if (existsSync(fullFilePath)) {
            fileChecks.push(
              Deno.open(fullFilePath, {
                read: true,
              }),
            );
          }
        }
      });

      const fileResps = await Promise.all(fileChecks);

      const activeFileResp = fileResps.find((fileResp) => fileResp);

      if (activeFileResp) {
        const dfsFileInfo: DFSFileInfo = {
          Contents: activeFileResp.readable,
        };

        return dfsFileInfo;
      } else if (defaultFileName) {
        throw new Error(
          `Unable to locate a local file at path ${filePath}, and no default file was found for ${defaultFileName}.`,
        );
      } else {
        throw new Error(`Unable to locate a local file at path ${filePath}.`);
      }
    },
  };
};

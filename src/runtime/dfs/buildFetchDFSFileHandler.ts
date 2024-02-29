import { DFSFileHandler } from './DFSFileHandler.ts';
import { DFSFileInfo } from './DFSFileInfo.ts';
import { getFileCheckPathsToProcess } from './getFileCheckPathsToProcess.ts';

export const buildFetchDFSFileHandler = (
  root: string,
  pathResolver?: (filePath: string) => string,
): DFSFileHandler => {
  return {
    async GetFileInfo(
      filePath: string,
      defaultFileName?: string,
    ): Promise<DFSFileInfo> {
      let finalFilePath = filePath;

      const fileCheckPaths = getFileCheckPathsToProcess(
        filePath,
        defaultFileName,
      );

      const fileChecks: Promise<Response>[] = [];

      fileCheckPaths.forEach((fcp) => {
        const resolvedPath = pathResolver ? pathResolver(fcp) : fcp;

        if (resolvedPath) {
          const fullFilePath = new URL(`.${resolvedPath}`, root);

          fileChecks.push(fetch(fullFilePath));

          finalFilePath = resolvedPath;
        }
      });

      const fileResps = await Promise.all(fileChecks);

      const activeFileResp = fileResps.find((fileResp) => fileResp.ok);

      if (activeFileResp) {
        const excludeHeaders = ['content-type'];

        const headers = excludeHeaders.reduce((headers, uh) => {
          if (!activeFileResp.headers.has(uh)) {
            headers[uh] = activeFileResp.headers.get(uh)!;
          }

          return headers;
        }, {} as Record<string, string>);

        const dfsFileInfo: DFSFileInfo = {
          Contents: activeFileResp.clone().body!,
          Headers: headers,
          Path: finalFilePath,
        };

        return dfsFileInfo;
      } else if (defaultFileName) {
        throw new Error(
          `Unable to locate a fetch file at path ${filePath}, and no default file was found for ${defaultFileName}.`,
        );
      } else {
        throw new Error(`Unable to locate a fetch file at path ${filePath}.`);
      }
    },
  };
};

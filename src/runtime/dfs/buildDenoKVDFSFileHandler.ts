import { DenoKVFileStream, DenoKVFileStreamData } from '../../utils/streams/DenoKVFileStream.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';
import { DFSFileInfo } from './DFSFileInfo.ts';
import { getFileCheckPathsToProcess } from './getFileCheckPathsToProcess.ts';
import { withDFSCache } from './withDFSCache.ts';

export const buildDenoKVDFSFileHandler = (
  denoKv: Deno.Kv,
  rootKey: Deno.KvKey,
  root: string,
  pathResolver?: (filePath: string) => string,
): DFSFileHandler => {
  const fileStream = new DenoKVFileStream(denoKv);

  rootKey = [...rootKey, 'Root', root];

  return {
    async GetFileInfo(
      filePath: string,
      revision: number,
      defaultFileName?: string,
      extensions?: string[],
      useCascading?: boolean,
      cacheDb?: Deno.Kv,
      cacheSeconds?: number,
    ): Promise<DFSFileInfo | undefined> {
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

          const fileChecks: Promise<
            | {
              Contents: ReadableStream<Uint8Array>;
              Headers: Record<string, string> | undefined;
            }
            | undefined
          >[] = [];

          fileCheckPaths.forEach((fcp) => {
            const resolvedPath = pathResolver ? pathResolver(fcp) : fcp;

            if (resolvedPath) {
              const fullFileKey = [
                ...rootKey,
                'Revision',
                revision,
                'Path',
                resolvedPath,
              ];

              fileChecks.push(fileStream.Read(fullFileKey));
            }
          });

          const fileResps = await Promise.all(fileChecks);

          const activeFileResp = fileResps.find((fileResp, i) => {
            finalFilePath = fileCheckPaths[i];

            return fileResp;
          });

          if (activeFileResp) {
            const dfsFileInfo: DFSFileInfo = {
              ...activeFileResp,
              Path: finalFilePath,
            };

            return dfsFileInfo;
          } else if (defaultFileName) {
            throw new Error(
              `Unable to locate a DenoKV file at path ${filePath}, and no default file was found for ${defaultFileName}.`,
            );
          } else {
            throw new Error(
              `Unable to locate a DenoKV file at path ${filePath}.`,
            );
          }
        },
        revision,
        cacheDb,
        cacheSeconds,
      );
    },

    async LoadAllPaths(revision: number): Promise<string[]> {
      const filesRootKey = [...rootKey];

      const filesRevisionRootKey = [...filesRootKey, 'Revision', revision!];

      const fileRevisionEntries = await denoKv.list<
        DenoKVFileStreamData<Uint8Array | Record<string, unknown>>
      >({
        prefix: filesRevisionRootKey,
        end: ['Chunks', 0],
      });

      const paths: string[] = [];

      for await (const fileRevisionEntry of fileRevisionEntries) {
        const filePath = fileRevisionEntry.key[
          fileRevisionEntry.key.length - 3
        ] as string;

        paths.push(filePath);
      }

      // Cleanup old revisions
      async function cleanup(): Promise<void> {
        const fileEntries = await denoKv.list<
          DenoKVFileStreamData<Uint8Array | Record<string, unknown>>
        >({
          prefix: filesRootKey,
        });

        const deleteCalls: Promise<void>[] = [];

        for await (const fileEntry of fileEntries) {
          const curKey = fileEntry.key.join('/');

          const revisionRoot = filesRevisionRootKey.join('/');

          if (!curKey.startsWith(revisionRoot)) {
            deleteCalls.push(denoKv.delete(fileEntry.key));
          }
        }

        await Promise.all(deleteCalls);
      }

      cleanup().then();

      return paths;
    },

    get Root(): string {
      return root;
    },

    async RemoveFile(filePath: string, revision: number): Promise<void> {
      const fullFileKey = [...rootKey, 'Revision', revision, 'Path', filePath];

      await fileStream.Remove(fullFileKey);
    },

    async WriteFile(
      filePath: string,
      revision: number,
      stream: ReadableStream<Uint8Array>,
      ttlSeconds?: number,
      headers?: Headers,
      maxChunkSize = 8000,
      _cacheDb?: Deno.Kv,
    ): Promise<void> {
      const fullFileKey = [...rootKey, 'Revision', revision, 'Path', filePath];

      await fileStream.Write(
        fullFileKey,
        stream,
        ttlSeconds,
        headers,
        maxChunkSize,
      );
    },
  };
};

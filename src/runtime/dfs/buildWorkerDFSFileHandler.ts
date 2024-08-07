import { EaCDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandler } from './DFSFileHandler.ts';
import { DFSFileInfo } from './DFSFileInfo.ts';
import { EaCDistributedFileSystemWorkerClient } from './workers/EaCDistributedFileSystemWorkerClient.ts';

export const buildWorkerDFSFileHandler = async (
  dfs: EaCDistributedFileSystem,
): Promise<DFSFileHandler> => {
  const dfsWorkerClient = new EaCDistributedFileSystemWorkerClient(
    dfs.WorkerPath!,
  );

  const started = (await dfsWorkerClient.Start({
    DFS: dfs,
  })) as { Root: string };

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
      return await dfsWorkerClient.GetFileInfo({
        FilePath: filePath,
        Revision: revision,
        DefaultFileName: defaultFileName,
        Extensions: extensions,
        UseCascading: useCascading,
        CacheDB: cacheDb,
        CacheSeconds: cacheSeconds,
      });
    },

    async LoadAllPaths(revision: number): Promise<string[]> {
      return await dfsWorkerClient.LoadAllPaths(revision);
    },

    get Root(): string {
      return started.Root;
    },

    async RemoveFile(
      filePath: string,
      revision: number,
      cacheDb?: Deno.Kv,
    ): Promise<void> {
      await dfsWorkerClient.RemoveFile({
        FilePath: filePath,
        Revision: revision,
        CacheDB: cacheDb,
      });
    },

    async WriteFile(
      filePath: string,
      revision: number,
      stream: ReadableStream<Uint8Array>,
      ttlSeconds?: number,
      headers?: Headers,
      maxChunkSize = 8000,
      cacheDb?: Deno.Kv,
    ): Promise<void> {
      const headersInit = Array.from(headers?.entries() || []).reduce(
        (acc, [key, val]) => {
          acc[key] = val;

          return acc;
        },
        {} as Record<string, string>,
      );

      await dfsWorkerClient.WriteFile({
        FilePath: filePath,
        Revision: revision,
        Stream: stream,
        TTLSeconds: ttlSeconds,
        Headers: headersInit,
        MaxChunkSize: maxChunkSize,
        CacheDB: cacheDb,
      });
    },
  };
};

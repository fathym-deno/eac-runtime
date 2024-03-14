import { DFSFileInfo } from './DFSFileInfo.ts';

export type DFSFileHandler = {
  GetFileInfo: (
    filePath: string,
    revision: number,
    defaultFileName?: string,
    extensions?: string[],
    useCascading?: boolean,
    cacheDb?: Deno.Kv,
    cacheSeconds?: number,
  ) => Promise<DFSFileInfo>;

  LoadAllPaths(revision: number): Promise<string[]>;

  readonly Root: string;

  WriteFile(
    filePath: string,
    revision: number,
    stream: ReadableStream<Uint8Array>,
    ttlSeconds?: number,
    headers?: Headers,
    maxChunkSize?: number,
    cacheDb?: Deno.Kv,
  ): Promise<void>;
};

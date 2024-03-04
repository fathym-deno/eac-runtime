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

  LoadAllPaths(): Promise<string[]>;
};

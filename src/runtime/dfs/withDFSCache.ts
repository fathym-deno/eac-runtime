import { denoKvCacheReadableStream } from '../../modules/cache/denoKvCacheReadableStream.ts';
import { denoKvReadReadableStreamCache } from '../../modules/cache/denoKvReadReadableStreamCache.ts';
import { DFSFileInfo } from './DFSFileInfo.ts';

export async function withDFSCache(
  filePath: string,
  loadFile: () => Promise<DFSFileInfo>,
  revision: number,
  cacheDb?: Deno.Kv,
  cacheSeconds?: number,
): Promise<DFSFileInfo> {
  const dfsCacheKey = ['DFS', 'Revision', revision, 'Path', filePath];

  if (cacheDb) {
    const cached = await denoKvReadReadableStreamCache(cacheDb, dfsCacheKey);

    if (cached) {
      return cached;
    }
  }

  const dfsFile = await loadFile();

  if (cacheDb && cacheSeconds) {
    denoKvCacheReadableStream(
      cacheDb,
      dfsCacheKey,
      dfsFile.Contents,
      cacheSeconds,
    );
  }

  return dfsFile;
}

import { denoKvCacheReadableStream } from '../../modules/cache/denoKvCacheReadableStream.ts';
import { denoKvReadReadableStreamCache } from '../../modules/cache/denoKvReadReadableStreamCache.ts';
import { DenoKVFileStream } from '../../utils/streams/DenoKVFileStream.ts';
import { DFSFileInfo } from './DFSFileInfo.ts';

export async function withDFSCache(
  filePath: string,
  loadFile: () => Promise<DFSFileInfo | undefined>,
  revision: number,
  cacheDb?: Deno.Kv,
  cacheSeconds?: number,
): Promise<DFSFileInfo | undefined> {
  const dfsCacheKey = ['DFS', 'Revision', revision, 'Path', filePath];

  const fileStream = cacheDb ? new DenoKVFileStream(cacheDb) : undefined;

  if (fileStream) {
    const cached = await denoKvReadReadableStreamCache(fileStream, dfsCacheKey);

    if (cached) {
      return cached;
    }
  }

  const dfsFile = await loadFile();

  if (dfsFile && fileStream && cacheSeconds) {
    denoKvCacheReadableStream(
      fileStream,
      dfsCacheKey,
      dfsFile.Contents,
      cacheSeconds,
    );
  }

  return dfsFile;
}

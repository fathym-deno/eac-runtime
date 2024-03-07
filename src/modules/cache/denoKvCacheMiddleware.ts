import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';
import { DenoKVFileStream } from '../../utils/streams/DenoKVFileStream.ts';
import { denoKvCacheReadableStream } from './denoKvCacheReadableStream.ts';
import { denoKvReadReadableStreamCache } from './denoKvReadReadableStreamCache.ts';

export function establishDenoKvCacheMiddleware(
  dbLookup: string,
  cacheSeconds: number,
  pathFilterRegex?: string,
): EaCRuntimeHandler {
  console.log('Configuring cache middleware...');

  return async (_req, ctx) => {
    console.log('Starting cache middleware...');

    const reqPath = ctx.Runtime.URLMatch.Path || '/';

    const respCacheKey = [
      'Response',
      'EaC',
      ctx.Runtime.EaC!.EnterpriseLookup!,
      'Revision',
      ctx.Runtime.Revision,
      'Project',
      ctx.Runtime.ProjectProcessorConfig.ProjectLookup,
      'Applications',
      ctx.Runtime.ApplicationProcessorConfig.ApplicationLookup,
      'Path',
      reqPath,
      ...(ctx.Runtime.URLMatch.Search ? ['Search', ctx.Runtime.URLMatch.Search] : []),
      ...(ctx.Runtime.URLMatch.Hash ? ['Hash', ctx.Runtime.URLMatch.Hash] : []),
    ];

    let resp: Response | undefined = undefined;

    const isCachePathFiltered = !pathFilterRegex || new RegExp(pathFilterRegex, 'i').test(reqPath);

    const cacheDb = await ctx.Runtime.IoC.Resolve(Deno.Kv, dbLookup);

    const fileStream = cacheDb ? new DenoKVFileStream(cacheDb) : undefined;

    if (fileStream && isCachePathFiltered) {
      console.log(
        `Lookuping up item in cache middleware: ${respCacheKey.join('|')}`,
      );

      const cached = await denoKvReadReadableStreamCache(fileStream, respCacheKey);

      if (cached) {
        console.log(
          `Return item from cache middleware: ${respCacheKey.join('|')}`,
        );

        resp = new Response(cached.Contents, {
          headers: cached.Headers || {},
        });

        const eTag = resp.headers.get('ETag');

        if (eTag) {
          // TODO(mcgear): Somehow limit how often we refresh the file
          storeForCaching().then();
        }
      }
    }

    async function storeForCaching() {
      const toCacheResp = await ctx.Next();

      if (fileStream && toCacheResp?.ok && isCachePathFiltered) {
        console.log(
          `Storing item in cache middleware: ${respCacheKey.join('|')}`,
        );

        denoKvCacheReadableStream(
          fileStream,
          respCacheKey,
          toCacheResp.clone().body!,
          cacheSeconds,
          toCacheResp.headers,
        );
      }

      return toCacheResp;
    }

    if (!resp) {
      resp = await storeForCaching();
    }

    return resp;
  };
}

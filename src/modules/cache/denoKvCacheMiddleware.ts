// deno-lint-ignore-file no-explicit-any
import {} from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';
import { DFSFileInfo } from '../../runtime/defaultDFSFileHandlerResolver.ts';

export function concatTypedArrays(a: Uint8Array, b: Uint8Array) {
  // a, b TypedArray of same type
  const c = new Uint8Array(a.length + b.length);

  c.set(a, 0);

  c.set(b, a.length);

  return c;
}

export function denoKvCacheReadableStream(
  kv: Deno.Kv,
  cacheKey: Deno.KvKey,
  stream: ReadableStream<Uint8Array>,
  cacheSeconds: number,
  headers?: Headers,
  maxChunkSize = 40000,
): void {
  if (stream) {
    let content = new Uint8Array();

    const contentChunks: Uint8Array[] = [];

    const fileReader = stream.getReader();

    fileReader.read().then(function processFile({ done, value }): any {
      if (done) {
        contentChunks.push(content);

        contentChunks.forEach((chunk, i) => {
          kv.set([...cacheKey, 'Chunks', i], chunk, {
            expireIn: 1000 * cacheSeconds,
          }).then();
        });

        return;
      }

      content = concatTypedArrays(content, value);

      const contentBlob = new Blob([content]);

      if (contentBlob.size > maxChunkSize) {
        contentChunks.push(content);

        content = new Uint8Array();
      }

      return fileReader.read().then(processFile);
    });

    if (headers) {
      const headersToCache: Record<string, string> = {};

      for (const hdr of headers.keys()) {
        headersToCache[hdr] = headers.get(hdr)!;
      }

      kv.set([...cacheKey, 'Headers'], headersToCache, {
        expireIn: 1000 * cacheSeconds,
      }).then();
    }
  }
}

export async function denoKvReadReadableStreamCache(
  kv: Deno.Kv,
  cacheKey: Deno.KvKey,
): Promise<DFSFileInfo | undefined> {
  const cachedFileChunks = await kv.list<Uint8Array>({
    prefix: [...cacheKey, 'Chunks'],
  });

  let content = new Uint8Array();

  for await (const cachedFileChunk of cachedFileChunks) {
    content = concatTypedArrays(content, cachedFileChunk.value!);
  }

  const cachedHeaders = await kv.get<Record<string, string>>([
    ...cacheKey,
    'Headers',
  ]);

  return content.length > 0
    ? {
      Contents: new Blob([content]).stream(),
      Headers: cachedHeaders.value || undefined,
    }
    : undefined;
}

export function establishDenoKvCacheMiddleware(
  dbLookup: string,
  cacheSeconds: number,
): EaCRuntimeHandler {
  console.log('Configuring cache middleware...');

  return async (req, ctx) => {
    const cacheDb = ctx.Databases[dbLookup] as Deno.Kv;

    console.log('Starting cache middleware...');

    const pattern = new URLPattern({
      pathname: ctx.ApplicationProcessorConfig.LookupConfig.PathPattern,
    });

    const patternResult = pattern.exec(req.url);

    const reqPath = patternResult!.pathname.groups[0]!;

    const respCacheKey = [
      'Response',
      'EaC',
      ctx.EaC!.EnterpriseLookup!,
      'Project',
      ctx.ProjectProcessorConfig.ProjectLookup,
      'Applications',
      ctx.ApplicationProcessorConfig.ApplicationLookup,
      'File',
      reqPath,
    ];

    let resp: Response | undefined = undefined;

    if (cacheDb) {
      console.log(
        `Lookuping up item in cache middleware: ${respCacheKey.join('|')}`,
      );

      const cached = await denoKvReadReadableStreamCache(cacheDb, respCacheKey);

      if (cached) {
        console.log(
          `Return item from cache middleware: ${respCacheKey.join('|')}`,
        );

        resp = new Response(cached.Contents, {
          headers: cached.Headers || {},
        });
      }
    }

    if (!resp) {
      resp = await ctx.next();

      if (cacheDb && resp) {
        console.log(
          `Storing item in cache middleware: ${respCacheKey.join('|')}`,
        );

        denoKvCacheReadableStream(
          cacheDb,
          respCacheKey,
          resp.clone().body!,
          cacheSeconds,
          resp.headers,
        );
      }
    }

    return resp;
  };
}

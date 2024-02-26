// deno-lint-ignore-file no-explicit-any
import {} from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';
import { DFSFileInfo } from '../../runtime/processors/defaultDFSFileHandlerResolver.ts';

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
  maxChunkSize = 8000,
): void {
  if (stream) {
    let content = new Uint8Array();

    const fileReader = stream.getReader();

    let chunkCount = -1;

    fileReader.read().then(function processFile({ done, value }): any {
      async function cacheChunk(chunk: Uint8Array): Promise<void> {
        ++chunkCount;

        await kv.set([...cacheKey, 'Chunks', chunkCount], chunk, {
          expireIn: 1000 * cacheSeconds,
        });
      }

      if (done) {
        if (content.length > 0) {
          cacheChunk(content).then();
        }

        return;
      }

      content = concatTypedArrays(content, value);

      const contentBlob = new Blob([content]);

      if (chunkCount < 0) {
        cacheChunk(content.slice(0, 1)).then();

        content = content.slice(1);
      }

      if (contentBlob.size > maxChunkSize) {
        cacheChunk(content.slice(0, maxChunkSize)).then();

        content = content.slice(maxChunkSize);
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
  const cachedFileCheck = await kv.get<Uint8Array>([...cacheKey, 'Chunks', 0]);

  const contents = cachedFileCheck.value
    ? new ReadableStream({
      async start(controller) {
        const cachedFileChunks = await kv.list<Uint8Array>({
          prefix: [...cacheKey, 'Chunks'],
        });

        for await (const cachedFileChunk of cachedFileChunks) {
          controller.enqueue(cachedFileChunk.value!);
        }

        controller.close();
      },
      cancel() {
        // divined.cancel();
      },
    })
    : undefined;

  if (contents) {
    const cachedHeaders = await kv.get<Record<string, string>>([
      ...cacheKey,
      'Headers',
    ]);

    return {
      Contents: contents,
      Headers: cachedHeaders.value || undefined,
    };
  } else {
    return undefined;
  }
}

export function establishDenoKvCacheMiddleware(
  dbLookup: string,
  cacheSeconds: number,
  pathFilterRegex?: string,
): EaCRuntimeHandler {
  console.log('Configuring cache middleware...');

  return async (req, ctx) => {
    const cacheDb = await ctx.IoC.Resolve(Deno.Kv, dbLookup);

    console.log('Starting cache middleware...');

    const pattern = new URLPattern({
      pathname: ctx.ApplicationProcessorConfig.LookupConfig.PathPattern,
    });

    const reqUrl = new URL(req.url);

    const patternResult = pattern.exec(reqUrl.href);

    const reqPath = patternResult!.pathname.groups[0]!;

    const respCacheKey = [
      'Response',
      'EaC',
      ctx.EaC!.EnterpriseLookup!,
      'Revision',
      ctx.Revision,
      'Project',
      ctx.ProjectProcessorConfig.ProjectLookup,
      'Applications',
      ctx.ApplicationProcessorConfig.ApplicationLookup,
      'Path',
      reqPath,
      ...(reqUrl.search ? ['Search', reqUrl.search] : []),
      ...(reqUrl.hash ? ['Hash', reqUrl.hash] : []),
    ];

    let resp: Response | undefined = undefined;

    const isCachePathFiltered = !pathFilterRegex || new RegExp(pathFilterRegex, 'i').test(reqPath);

    if (cacheDb && isCachePathFiltered) {
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

      if (cacheDb && resp?.ok && isCachePathFiltered) {
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

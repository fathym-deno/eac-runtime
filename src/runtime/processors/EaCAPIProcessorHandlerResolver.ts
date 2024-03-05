import {
  base64,
  EaCAPIProcessor,
  esbuild,
  establishHeaders,
  isEaCAPIProcessor,
  processCacheControlHeaders,
  toText,
} from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { DFSFileHandlerResolver } from '../dfs/DFSFileHandlerResolver.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { EAC_RUNTIME_DEV, IS_BUILDING, SUPPORTS_WORKERS } from '../../constants.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EaCRuntimeHandlerPipeline } from '../EaCRuntimeHandlerPipeline.ts';
import { EaCRuntimeHandlers } from '../EaCRuntimeHandlers.ts';

export type PathMatch = {
  APIHandlers: EaCRuntimeHandlerPipeline;
  Path: string;
  Pattern: URLPattern;
  PatternText: string;
  Priority: number;
};

export const pathToPatternRegexes: [RegExp, string, number][] = [
  // Handle [[optional]]
  [/\[\[(.*?)\]\]/g, '{/:$1}?', 2],
  // Handle [...ident]
  [/\[\.\.\.(.*?)\]/g, ':$1*', -1000],
  // Handle [segment]
  [/\[(.*?)\]/g, ':$1', 3],
];

export async function convertFilePathToPattern(
  fileHandler: DFSFileHandler,
  filePath: string,
  processor: EaCAPIProcessor,
  middleware: [
    string,
    EaCRuntimeHandler | EaCRuntimeHandler[] | EaCRuntimeHandlers,
  ][],
): Promise<PathMatch> {
  let parts = filePath.split('/');

  const lastPart = parts.pop();

  if (lastPart && lastPart !== processor.DFS.DefaultFile) {
    parts.push(lastPart.replace(/\.\w+$/, ''));
  }

  let priority = parts.length * 1000000;

  if (parts.length === 1) {
    parts.push('');
  }

  const pipeline = new EaCRuntimeHandlerPipeline();

  parts = parts.map((part) => {
    const partCheck = pathToPatternRegexes.find(([pc]) => pc.test(part));

    if (partCheck) {
      const [partPattern, partFix, partWeight] = partCheck;

      priority -= 1000;

      priority += partWeight;

      part = part.replace(partPattern, partFix);
    }

    if (part === '.') {
      part = '';
    }

    return part;
  });

  const patternText = parts.join('/').replace('/{/:', '{/:');

  const api = (await loadEaCRuntimeHandlers(
    fileHandler,
    filePath,
    processor,
  )) as EaCRuntimeHandler | EaCRuntimeHandlers;

  const apiMiddleware = middleware
    .filter(([root]) => {
      return filePath.startsWith(root);
    })
    .flatMap(([_root, handler]) => Array.isArray(handler) ? handler : [handler]);

  pipeline.Append(...apiMiddleware);

  pipeline.Append(api);

  return {
    APIHandlers: pipeline,
    Path: filePath,
    Pattern: new URLPattern({
      pathname: patternText,
    }),
    PatternText: patternText,
    Priority: priority,
  };
}

export async function loadMiddleware(
  fileHandler: DFSFileHandler,
  filePath: string,
  processor: EaCAPIProcessor,
): Promise<
  [string, EaCRuntimeHandler | EaCRuntimeHandler[] | EaCRuntimeHandlers]
> {
  const handler = await loadEaCRuntimeHandlers(
    fileHandler,
    filePath,
    processor,
  );

  const root = filePath.replace('_middleware.ts', '');

  return [root, handler];
}

export async function loadEaCRuntimeHandlers(
  fileHandler: DFSFileHandler,
  filePath: string,
  processor: EaCAPIProcessor,
): Promise<EaCRuntimeHandler | EaCRuntimeHandler[] | EaCRuntimeHandlers> {
  const file = await fileHandler.GetFileInfo(
    filePath,
    Date.now(),
    processor.DFS.DefaultFile,
    processor.DFS.Extensions,
    processor.DFS.UseCascading,
  );

  const fileContents = await toText(file.Contents);

  const result = await esbuild.transform(fileContents, { loader: 'ts' });

  const enc = base64.encodeBase64(result.code);

  const apiUrl = `data:application/javascript;base64,${enc}`;

  const apiModule = await import(apiUrl);

  const handlers = apiModule.default;

  return handlers;
}

export function loadApiPathPatterns(
  fileHandler: DFSFileHandler,
  processor: EaCAPIProcessor,
): Promise<PathMatch[]> {
  return fileHandler.LoadAllPaths().then((allPaths) => {
    return esbuild
      .initialize({
        worker: SUPPORTS_WORKERS(),
      })
      .then(() => {
        if (!IS_BUILDING) {
          const middlewarePaths = allPaths
            .filter((p) => p.endsWith('_middleware.ts'))
            .sort((a, b) => a.split('/').length - b.split('/').length);

          const middlewareCalls = middlewarePaths.map((p) => {
            return loadMiddleware(fileHandler, p, processor);
          });

          return Promise.all(middlewareCalls).then((middleware) => {
            console.log(middleware.map((m) => m[0]));
            const apiPathPatternCalls = allPaths
              .filter((p) => !p.endsWith('_middleware.ts'))
              .map((p) => {
                return convertFilePathToPattern(
                  fileHandler,
                  p,
                  processor,
                  middleware,
                );
              });

            return Promise.all(apiPathPatternCalls).then((patterns) => {
              esbuild.stop();

              return patterns
                .sort((a, b) => b.Priority - a.Priority)
                .sort((a, b) => {
                  const aCatch = a.PatternText.endsWith('*') ? -1 : 1;
                  const bCatch = b.PatternText.endsWith('*') ? -1 : 1;

                  return bCatch - aCatch;
                });
            });
          });
        } else {
          return [];
        }
      });
  });
}

export const EaCAPIProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(ioc, appProcCfg) {
    if (!isEaCAPIProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCAPIProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCAPIProcessor;

    let apiPathPatterns: PathMatch[] = [];

    const filesReady = new Promise<DFSFileHandler>((resolve, reject) => {
      ioc
        .Resolve<DFSFileHandlerResolver>(ioc.Symbol('DFSFileHandler'))
        .then((defaultDFSFileHandlerResolver: DFSFileHandlerResolver) => {
          defaultDFSFileHandlerResolver
            .Resolve(ioc, processor.DFS)
            .then((fileHandler): void => {
              loadApiPathPatterns(fileHandler, processor).then((patterns) => {
                apiPathPatterns = patterns;

                console.log(apiPathPatterns.map((p) => p.PatternText));

                resolve(fileHandler);
              });
            })
            .catch((err) => reject(err));
        });
    });

    filesReady.then();

    return Promise.resolve(async (req, ctx) => {
      await filesReady;

      const apiTestUrl = new URL(
        `.${ctx.Runtime.URLMatch.Path}`,
        new URL('https://notused.com'),
      );

      const match = apiPathPatterns.find((app) => {
        const isMatch = app.Pattern.test(apiTestUrl);

        return isMatch;
      });

      if (!match) {
        throw new Deno.errors.NotFound('The API call could not be found.');
      }

      const patternResult = match!.Pattern.exec(apiTestUrl);

      ctx.Params = patternResult?.pathname.groups || {};

      let resp = match.APIHandlers.Execute(req, ctx);

      if (processor.DefaultContentType) {
        resp = await resp;

        if (
          !resp.headers.has('content-type') ||
          resp.headers.get('content-type') === 'text/plain;charset=UTF-8'
        ) {
          resp = new Response(resp.body, {
            headers: establishHeaders(resp.headers, {
              'Content-Type': processor.DefaultContentType,
            }),
            status: resp.status,
            statusText: resp.statusText,
          });
        }
      }

      if (processor.CacheControl && !EAC_RUNTIME_DEV()) {
        resp = processCacheControlHeaders(
          await resp,
          processor.CacheControl,
          processor.ForceCache,
        );
      }

      return resp;
    });
  },
};

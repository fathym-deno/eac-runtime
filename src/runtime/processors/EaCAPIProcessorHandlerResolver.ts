import {
  base64,
  EaCAPIProcessor,
  establishHeaders,
  isEaCAPIProcessor,
  processCacheControlHeaders,
  toText,
} from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { DFSFileHandlerResolver } from '../dfs/DFSFileHandlerResolver.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { EAC_RUNTIME_DEV } from '../../constants.ts';
import { EaCRuntimeHandlers } from '../EaCRuntimeHandlers.ts';
import { KnownMethod } from '../KnownMethod.ts';

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
  path: string,
  processor: EaCAPIProcessor,
): Promise<PathMatch> {
  let parts = path.split('/');

  const lastPart = parts.pop();

  if (lastPart && lastPart !== processor.DFS.DefaultFile) {
    parts.push(lastPart.replace(/\.\w+$/, ''));
  }

  let priority = parts.length * 1000000;

  if (parts.length === 1) {
    parts.push('');
  }

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

  const file = await fileHandler.GetFileInfo(
    path,
    Date.now(),
    processor.DFS.DefaultFile,
    processor.DFS.Extensions,
    processor.DFS.UseCascading,
  );

  const fileContents = await toText(file.Contents);

  const enc = base64.encodeBase64(fileContents);

  const apiUrl = `data:application/typescript;base64,${enc}`;

  const apiModule = await import(apiUrl);

  const api = apiModule.default as EaCRuntimeHandlers;

  return {
    APIHandlers: api,
    Path: path,
    Pattern: new URLPattern({
      pathname: patternText,
    }),
    PatternText: patternText,
    Priority: priority,
  };
}

export type PathMatch = {
  APIHandlers: EaCRuntimeHandlers;
  Path: string;
  Pattern: URLPattern;
  PatternText: string;
  Priority: number;
};

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
              fileHandler.LoadAllPaths().then((allPaths): void => {
                const apiPathPatternCalls = allPaths.map((p) => {
                  return convertFilePathToPattern(
                    fileHandler,
                    p,
                    processor,
                  );
                });

                Promise.all(apiPathPatternCalls).then((app) => {
                  apiPathPatterns = app
                    .sort((a, b) => b.Priority - a.Priority)
                    .sort((a, b) => {
                      const aCatch = a.PatternText.endsWith('*') ? -1 : 1;
                      const bCatch = b.PatternText.endsWith('*') ? -1 : 1;

                      return bCatch - aCatch;
                    });

                  console.log(apiPathPatterns.map((p) => p.PatternText));

                  resolve(fileHandler);
                });
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

      const handler = match.APIHandlers[req.method.toUpperCase() as KnownMethod];

      if (!handler) {
        throw new Deno.errors.NotFound(
          `There is not handler configured for the '${req.method}' method.`,
        );
      }

      let resp = handler(req, ctx);

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

// deno-lint-ignore-file no-explicit-any
import { ComponentType, EaCDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { IS_BUILDING } from '../../constants.ts';
import { loadLayout } from '../../runtime/apps/loadLayout.ts';
import { loadMiddleware } from './loadMiddleware.ts';
import { PathMatch } from './PathMatch.ts';
import { convertFilePathToPattern } from './convertFilePathToPattern.ts';

export async function loadRequestPathPatterns(
  fileHandler: DFSFileHandler,
  dfs: EaCDistributedFileSystem,
  loadHandlers: (
    fileHandler: DFSFileHandler,
    filePath: string,
    dfs: EaCDistributedFileSystem,
    layouts: [string, ComponentType<any>][],
  ) => Promise<EaCRuntimeHandlerResult>,
): Promise<PathMatch[]> {
  const allPaths = await fileHandler.LoadAllPaths();

  if (!IS_BUILDING) {
    const moduleLoaderCalls: [
      Promise<[string, EaCRuntimeHandlerResult][]>,
      Promise<[string, ComponentType<any>][]>,
    ] = [
      (() => {
        const middlewarePaths = allPaths
          .filter((p) => p.endsWith('_middleware.ts'))
          .sort((a, b) => a.split('/').length - b.split('/').length);

        const middlewareCalls = middlewarePaths.map((p) => {
          return loadMiddleware(fileHandler, p, dfs);
        });

        return Promise.all(middlewareCalls);
      })(),
      (() => {
        const layoutPaths = allPaths
          .filter((p) => p.endsWith('_layout.tsx'))
          .sort((a, b) => a.split('/').length - b.split('/').length);

        const layoutCalls = layoutPaths.map((p) => {
          return loadLayout(fileHandler, p, dfs);
        });

        return Promise.all(layoutCalls);
      })(),
    ];

    const [middleware, layouts] = await Promise.all(moduleLoaderCalls);

    console.log('Middleware: ');
    console.log(middleware.map((m) => m[0]));
    console.log();

    console.log('Layouts: ');
    console.log(layouts.map((m) => m[0]));
    console.log();

    const apiPathPatternCalls = allPaths
      .filter((p) => !p.endsWith('_middleware.ts') && !p.endsWith('_layout.tsx'))
      .map((p) => {
        return convertFilePathToPattern(
          fileHandler,
          p,
          dfs,
          loadHandlers,
          middleware,
          layouts,
        );
      });

    const patterns = await Promise.all(apiPathPatternCalls);

    return patterns
      .sort((a, b) => b.Priority - a.Priority)
      .sort((a, b) => {
        const aCatch = a.PatternText.endsWith('*') ? -1 : 1;
        const bCatch = b.PatternText.endsWith('*') ? -1 : 1;

        return bCatch - aCatch;
      });
  } else {
    return [];
  }
}

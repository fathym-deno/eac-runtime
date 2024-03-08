import { EaCDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { IS_BUILDING } from '../../constants.ts';
import { loadMiddleware } from './loadMiddleware.ts';
import { PathMatch } from './PathMatch.ts';
import { convertFilePathToPattern } from './convertFilePathToPattern.ts';

export async function loadRequestPathPatterns(
  fileHandler: DFSFileHandler,
  dfs: EaCDistributedFileSystem,
  loadHandlers: (
    allPaths: string[],
    filePath: string,
  ) => Promise<EaCRuntimeHandlerResult>,
  revision: number,
): Promise<PathMatch[]> {
  const allPaths = await fileHandler.LoadAllPaths(revision);

  if (!IS_BUILDING) {
    const middlewarePaths = allPaths
      .filter((p) => p.endsWith('_middleware.ts'))
      .sort((a, b) => a.split('/').length - b.split('/').length);

    const middlewareCalls = middlewarePaths.map((p) => {
      return loadMiddleware(fileHandler, p, dfs);
    });

    const middleware = await Promise.all(middlewareCalls);

    console.log('Middleware: ');
    console.log(middleware.map((m) => m[0]));
    console.log();

    const apiPathPatternCalls = allPaths
      .filter(
        (p) => !p.endsWith('_middleware.ts') && !p.endsWith('_layout.tsx'),
      )
      .map((p) => {
        return convertFilePathToPattern(
          allPaths,
          p,
          dfs,
          loadHandlers,
          middleware,
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

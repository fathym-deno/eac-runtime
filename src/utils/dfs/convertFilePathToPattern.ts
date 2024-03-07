// deno-lint-ignore-file no-explicit-any
import { ComponentType, EaCDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';
import { EaCRuntimeHandlerPipeline } from '../../runtime/EaCRuntimeHandlerPipeline.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { PathMatch, pathToPatternRegexes } from './PathMatch.ts';

export async function convertFilePathToPattern(
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
  loadHandlers: (
    fileHandler: DFSFileHandler,
    filePath: string,
    dfs: EaCDistributedFileSystem,
    layouts: [string, ComponentType<any>][],
  ) => Promise<EaCRuntimeHandlerResult>,
  middleware: [string, EaCRuntimeHandlerResult][],
  layouts: [string, ComponentType<any>][],
): Promise<PathMatch> {
  let parts = filePath.split('/');

  const lastPart = parts.pop();

  if (lastPart && lastPart !== dfs.DefaultFile) {
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

  const apiMiddleware = middleware
    .filter(([root]) => {
      return filePath.startsWith(root);
    })
    .flatMap(([_root, handler]) => Array.isArray(handler) ? handler : [handler]);

  const pipeline = new EaCRuntimeHandlerPipeline();

  pipeline.Append(...apiMiddleware);

  const handler = await loadHandlers(fileHandler, filePath, dfs, layouts);

  pipeline.Append(...(Array.isArray(handler) ? handler : [handler]));

  return {
    Handlers: pipeline,
    Path: filePath,
    Pattern: new URLPattern({
      pathname: patternText,
    }),
    PatternText: patternText,
    Priority: priority,
  };
}

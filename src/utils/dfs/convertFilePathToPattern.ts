import { EaCDistributedFileSystem } from '../../src.deps.ts';
import { EaCRuntimeHandlerPipeline } from '../../runtime/EaCRuntimeHandlerPipeline.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { PathMatch, pathToPatternRegexes } from './PathMatch.ts';

export async function convertFilePathToPattern(
  allPaths: string[],
  filePath: string,
  dfs: EaCDistributedFileSystem,
  loadHandlers: (
    allPaths: string[],
    filePath: string,
  ) => Promise<EaCRuntimeHandlerResult>,
  middleware: [string, EaCRuntimeHandlerResult][],
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

  const reqMiddleware = middleware
    .filter(([root]) => {
      return filePath.startsWith(root);
    })
    .flatMap(([_root, handler]) => Array.isArray(handler) ? handler : [handler]);

  const pipeline = new EaCRuntimeHandlerPipeline();

  pipeline.Append(...reqMiddleware);

  const handler = await loadHandlers(allPaths, filePath);

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

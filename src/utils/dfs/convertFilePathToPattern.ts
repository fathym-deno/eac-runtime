import { EaCDistributedFileSystem } from '../../src.deps.ts';
import { pathToPatternRegexes } from './PathMatch.ts';

export function convertFilePathToPattern(
  filePath: string,
  dfs: EaCDistributedFileSystem,
): { patternText: string; priority: number } {
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

  return { patternText, priority };
}

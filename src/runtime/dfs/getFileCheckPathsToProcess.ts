export function getFileCheckPathsToProcess(
  filePath: string,
  defaultFileName?: string,
): string[] {
  const pathParts = filePath?.split('/') || [];

  const lastPart = pathParts.findLast((pp) => pp);

  if (!lastPart?.includes('.') && defaultFileName) {
    pathParts.push(defaultFileName);
  }

  const fileName = pathParts.pop()!;

  const fileChecks: string[] = [];

  do {
    const currentPathRoot = `${pathParts.join('/')}/`.replace('//', '/');

    const curFilePath = new URL(
      fileName,
      new URL(currentPathRoot, 'https://notused.com/'),
    ).pathname;

    fileChecks.push(curFilePath);

    pathParts.pop();
  } while (pathParts.length > 0);

  return [...new Set(fileChecks)];
}

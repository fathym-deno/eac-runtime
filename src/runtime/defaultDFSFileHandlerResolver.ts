import {
  EaCDistributedFileSystem,
  existsSync,
  isEaCLocalDistributedFileSystem,
  isEaCNPMDistributedFileSystem,
  path,
} from '../src.deps.ts';

export type DFSFileInfo = {
  Contents: ReadableStream<Uint8Array>;

  Headers?: Record<string, string>;
};

export type DFSFileHandler = {
  GetFileInfo: (
    filePath: string,
    defaultFileName?: string,
  ) => Promise<DFSFileInfo>;
};

export const buildLocalDFSFileHandler = (
  root: string,
  pathResolver?: (filePath: string) => string,
): DFSFileHandler => {
  return {
    async GetFileInfo(
      filePath: string,
      defaultFileName?: string,
    ): Promise<DFSFileInfo> {
      const fileCheckPaths = getFileCheckPathsToProcess(
        filePath,
        defaultFileName,
      );

      const fileChecks: Promise<Deno.FsFile>[] = [];

      fileCheckPaths.forEach((fcp) => {
        const resolvedPath = pathResolver ? pathResolver(fcp) : fcp;

        if (resolvedPath) {
          const fullFilePath = path.join(root || '', resolvedPath);

          if (existsSync(fullFilePath)) {
            fileChecks.push(
              Deno.open(fullFilePath, {
                read: true,
              }),
            );
          }
        }
      });

      const fileResps = await Promise.all(fileChecks);

      const activeFileResp = fileResps.find((fileResp) => fileResp);

      if (activeFileResp) {
        const dfsFileInfo: DFSFileInfo = {
          Contents: activeFileResp.readable,
        };

        return dfsFileInfo;
      } else if (defaultFileName) {
        throw new Error(
          `Unable to locate a local file at path ${filePath}, and no default file was found for ${defaultFileName}.`,
        );
      } else {
        throw new Error(`Unable to locate a local file at path ${filePath}.`);
      }
    },
  };
};

export function getFileCheckPathsToProcess(
  filePath: string,
  defaultFileName?: string,
): string[] {
  const pathParts = filePath.split('/');

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

export const buildFetchDFSFileHandler = (
  root: string,
  pathResolver?: (filePath: string) => string,
): DFSFileHandler => {
  return {
    async GetFileInfo(
      filePath: string,
      defaultFileName?: string,
    ): Promise<DFSFileInfo> {
      const fileCheckPaths = getFileCheckPathsToProcess(
        filePath,
        defaultFileName,
      );

      const fileChecks: Promise<Response>[] = [];

      fileCheckPaths.forEach((fcp) => {
        const resolvedPath = pathResolver ? pathResolver(fcp) : fcp;

        if (resolvedPath) {
          const fullFilePath = new URL(`.${resolvedPath}`, root);

          fileChecks.push(fetch(fullFilePath));
        }
      });

      const fileResps = await Promise.all(fileChecks);

      const activeFileResp = fileResps.find((fileResp) => fileResp.ok);

      if (activeFileResp) {
        const excludeHeaders = ['content-type'];

        const dfsFileInfo: DFSFileInfo = {
          Contents: activeFileResp.clone().body!,
          Headers: excludeHeaders.reduce((headers, uh) => {
            if (!activeFileResp.headers.has(uh)) {
              headers[uh] = activeFileResp.headers.get(uh)!;
            }

            return headers;
          }, {} as Record<string, string>),
        };

        return dfsFileInfo;
      } else if (defaultFileName) {
        throw new Error(
          `Unable to locate a fetch file at path ${filePath}, and no default file was found for ${defaultFileName}.`,
        );
      } else {
        throw new Error(`Unable to locate a fetch file at path ${filePath}.`);
      }
    },
  };
};

export function defaultDFSFileHandlerResolver(
  dfs: EaCDistributedFileSystem,
): Promise<DFSFileHandler> {
  let handler: DFSFileHandler;

  if (isEaCNPMDistributedFileSystem(dfs)) {
    // const npmPackagePath = `https://registry.npmjs.org/${dfs.Package}`;

    // const packageDetailsResp = await fetch(npmPackagePath);

    // const packageDetails = await packageDetailsResp.json();

    // let version = dfs.Version;

    // if (dfs.Version in packageDetails['dist-tags']) {
    //   version = packageDetails['dist-tags'][dfs.Version];
    // }

    // const fileMapPath = `https://www.npmjs.com/package/${dfs.Package}/v/${version}/index`;

    // const npmFilesMapResp = await fetch(fileMapPath);

    // const npmFilesMap = await npmFilesMapResp.json();

    // const fileRoot = 'https://www.npmjs.com/package/@lowcodeunit/public-web-blog/file/';

    // return buildFetchDFSFileHandler(fileRoot, (filePath) => {
    //   if (filePath in npmFilesMap.files) {
    //     return npmFilesMap.files[filePath].hex;
    //   } else {
    //     return '';
    //   }
    // });

    // const fileRoot = new URL(`${dfs.Package}/`, 'https://esm.sh/');
    const fileRoot = new URL(`${dfs.Package}/`, 'https://cdn.skypack.dev/');

    handler = buildFetchDFSFileHandler(fileRoot.href);
  } else if (isEaCLocalDistributedFileSystem(dfs)) {
    handler = buildLocalDFSFileHandler(dfs.FileRoot);
  } else {
    handler = buildLocalDFSFileHandler('.');
  }

  return Promise.resolve(handler);
}

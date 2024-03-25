// deno-lint-ignore-file no-explicit-any
import {
  // base64,
  EaCDistributedFileSystem,
  ESBuild,
  path,
  toText,
} from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';
// import { IS_DENO_DEPLOY } from '../../constants.ts';

export async function importDFSTypescriptModule(
  _esbuild: ESBuild,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
  loader: 'ts' | 'tsx',
): Promise<{ filePath: string; module: any; contents: string } | undefined> {
  const file = await fileHandler.GetFileInfo(
    filePath,
    Date.now(),
    dfs.DefaultFile,
    dfs.Extensions,
    dfs.UseCascading,
  );

  if (file) {
    let fileContents = await toText(file!.Contents);

    if (loader === 'tsx') {
      fileContents = `import { Fragment, h } from "preact";\n${fileContents}`;
    }

    let apiUrl: string;

    // if (IS_DENO_DEPLOY()) {
    //   const result = await esbuild.transform(fileContents, {
    //     loader: loader,
    //     // jsx: 'react-jsx',
    //     jsxImportSource: 'preact',
    //     jsxFactory: 'h',
    //     jsxFragment: 'Fragment',
    //     platform: 'browser',
    //   });

    //   // const enc = base64.encodeBase64(fileContents);
    //   const enc = base64.encodeBase64(result.code);

    //   // const apiUrl = `data:application/typescript;base64,${enc}`;
    //   apiUrl = `data:application/javascript;base64,${enc}`;
    // } else {
    if (
      fileHandler.Root.startsWith('http://') ||
      fileHandler.Root.startsWith('https://')
    ) {
      apiUrl = new URL(filePath, fileHandler.Root).href;

      // if (!apiUrl.includes('?')) {
      //   apiUrl += `?Rev=${Date.now()}`;
      // }
    } else {
      apiUrl = `file:///${
        path.join(
          Deno.cwd(),
          fileHandler.Root,
          filePath,
        )
      }`;
    }
    // }

    const module = await import(apiUrl);

    return { filePath: apiUrl, module, contents: fileContents };
  } else {
    return undefined;
  }
}

// deno-lint-ignore-file no-explicit-any
import { base64, EaCDistributedFileSystem, esbuild, toText } from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';

export async function importDFSTypescriptModule(
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
  loader: 'ts' | 'tsx',
): Promise<{ module: any; contents: string }> {
  const file = await fileHandler.GetFileInfo(
    filePath,
    Date.now(),
    dfs.DefaultFile,
    dfs.Extensions,
    dfs.UseCascading,
  );

  let fileContents = await toText(file.Contents);

  if (loader === 'tsx') {
    fileContents = `import { Fragment, h } from "preact";\n${fileContents}`;
  }

  const result = await esbuild.transform(fileContents, {
    loader: loader,
    // jsx: 'react-jsx',
    jsxImportSource: 'preact',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    platform: 'browser',
  });

  // const enc = base64.encodeBase64(fileContents);
  const enc = base64.encodeBase64(result.code);

  // const apiUrl = `data:application/typescript;base64,${enc}`;
  const apiUrl = `data:application/javascript;base64,${enc}`;

  const module = await import(apiUrl);

  return { module, contents: result.code };
}

// deno-lint-ignore-file no-explicit-any
import { base64, EaCDistributedFileSystem, esbuild, toText } from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';

export async function importDFSTypescriptModule(
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
  loader: 'ts' | 'tsx',
): Promise<any> {
  const file = await fileHandler.GetFileInfo(
    filePath,
    Date.now(),
    dfs.DefaultFile,
    dfs.Extensions,
    dfs.UseCascading,
  );

  const fileContents = await toText(file.Contents);

  const result = await esbuild.transform(fileContents, {
    loader: loader,
    // jsx: 'react-jsx',
    jsxImportSource: 'preact',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  });

  // const enc = base64.encodeBase64(fileContents);
  const enc = base64.encodeBase64(result.code);

  // const apiUrl = `data:application/typescript;base64,${enc}`;
  const apiUrl = `data:application/javascript;base64,${enc}`;

  return await import(apiUrl);
}

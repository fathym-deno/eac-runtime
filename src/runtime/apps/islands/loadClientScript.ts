import { esbuild } from '../../../src.deps.ts';

export async function loadClientScript(
  clientPath: string,
  loader: esbuild.Loader,
  transform?: boolean,
): Promise<string> {
  const clientUrl = new URL(`.${clientPath}`, import.meta.url);

  let clientScript = await Deno.readTextFile(clientUrl);

  if (transform) {
    const result = await esbuild.transform(clientScript, {
      loader: loader,
    });

    if (!result) {
      throw new Deno.errors.NotFound(
        'There was an issue loading the client script.',
      );
    }

    clientScript = result.code;
  }

  return clientScript;
}

import { esbuild } from '../../../src.deps.ts';

export async function loadClientScript(
  clientPath: string,
  loader: esbuild.Loader,
  transform?: boolean,
): Promise<string> {
  const clientUrl = new URL(`.${clientPath}`, import.meta.url);

  let clientScript: string;

  if (clientUrl.href.startsWith('file:///')) {
    clientScript = await Deno.readTextFile(clientUrl);
  } else {
    const clientScriptResp = await fetch(clientUrl);

    clientScript = await clientScriptResp.text();
  }

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

import { transpile } from '../../../src.deps.ts';

export async function loadIslandClientScript(
  islandsClientPath: string,
): Promise<string> {
  const clientUrl = new URL(`.${islandsClientPath}`, import.meta.url);

  const result = await transpile(clientUrl);

  const code = result.get(clientUrl.href);

  if (!code) {
    throw new Deno.errors.NotFound(
      'There was an issue loading the client script.',
    );
  }

  return code;
}

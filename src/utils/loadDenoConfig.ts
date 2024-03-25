import { jsonc, path } from '../src.deps.ts';
import { DenoConfig } from './DenoConfig.ts';

export async function loadDenoConfig(
  denoCfgPath?: string,
): Promise<DenoConfig> {
  const denoJsonPath = path.join(Deno.cwd(), denoCfgPath || './deno.jsonc');

  const denoJsonsStr = await Deno.readTextFile(denoJsonPath);

  return jsonc.parse(denoJsonsStr) as DenoConfig;
}

export function loadDenoConfigSync(denoCfgPath?: string): DenoConfig {
  const denoJsonPath = path.join(Deno.cwd(), denoCfgPath || './deno.jsonc');

  const denoJsonsStr = Deno.readTextFileSync(denoJsonPath);

  return jsonc.parse(denoJsonsStr) as DenoConfig;
}

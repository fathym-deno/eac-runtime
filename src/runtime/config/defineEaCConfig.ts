import { merge } from '../../src.deps.ts';
import { DefaultEaCConfig } from './DefaultEaCConfig.ts';
import { EaCRuntimeConfig } from './EaCRuntimeConfig.ts';

export async function defineEaCConfig(
  config: Partial<EaCRuntimeConfig> | Promise<Partial<EaCRuntimeConfig>>,
): Promise<EaCRuntimeConfig> {
  return merge(DefaultEaCConfig, await config);
}

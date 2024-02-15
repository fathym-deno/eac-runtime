import { merge, colors } from '../../src.deps.ts';
import { isPromise } from '../../utils/type-guards/isPromise.ts';
import { DefaultEaCRuntime } from '../DefaultEaCRuntime.ts';
import { EaCRuntimeConfig } from './EaCRuntimeConfig.ts';

export const DefaultEaCConfig: EaCRuntimeConfig = {
  Runtime: new DefaultEaCRuntime(),
  Server: {
    onListen: (params) => {
      const address = colors.green(`http://localhost:${params.port}`);

      const fathymGreen: colors.Rgb = { r: 74, g: 145, b: 142 };

      console.log();
      console.log(colors.bgRgb24(' 🔥 EaC Runtime Ready ', fathymGreen));
      console.log(colors.rgb24(`\t${address}`, fathymGreen));
      console.log();
    },
  },
};

export async function defineEaCConfig(
  config: Partial<EaCRuntimeConfig> | Promise<Partial<EaCRuntimeConfig>>
): Promise<EaCRuntimeConfig> {
  if (isPromise(config)) {
    config = await config;
  }

  return merge(DefaultEaCConfig, config);
}

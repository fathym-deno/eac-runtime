import { colors } from '../../src.deps.ts';
import { DefaultEaCRuntime } from '../DefaultEaCRuntime.ts';
import { EaCRuntimeConfig } from './EaCRuntimeConfig.ts';
import { defaultAppHandlerResolver } from './defaultAppHandlerResolver.ts';

export const DefaultEaCConfig: EaCRuntimeConfig = {
  ApplicationHandlerResolver: defaultAppHandlerResolver,
  Middleware: [],
  Runtime: (cfg: EaCRuntimeConfig) => new DefaultEaCRuntime(cfg),
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

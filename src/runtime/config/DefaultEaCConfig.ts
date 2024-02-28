import { colors } from '../../src.deps.ts';
import { DefaultEaCRuntime } from '../DefaultEaCRuntime.ts';
import { EaCRuntimeConfig } from './EaCRuntimeConfig.ts';
import { fathymGreen } from '../../constants.ts';
import FathymCorePlugin from '../plugins/FathymCorePlugin.ts';

export const DefaultEaCConfig: EaCRuntimeConfig = {
  ModifierLookups: [],
  Plugins: [new FathymCorePlugin()],
  Runtime: (cfg: EaCRuntimeConfig) => new DefaultEaCRuntime(cfg),
  Server: {
    onListen: (params) => {
      const address = colors.green(`http://localhost:${params.port}`);

      console.log();
      console.log(colors.bgRgb24(' 🐙 EaC Runtime Ready ', fathymGreen));
      console.log(colors.rgb24(`\t${address}`, fathymGreen));
      console.log();
    },
  },
};

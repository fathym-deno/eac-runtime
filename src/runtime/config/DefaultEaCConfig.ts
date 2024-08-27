import { colors, getPackageLoggerSync } from '../../src.deps.ts';
import { DefaultEaCRuntime } from '../DefaultEaCRuntime.ts';
import { EaCRuntimeConfig } from './EaCRuntimeConfig.ts';
import { fathymGreen } from '../../constants.ts';
import FathymCorePlugin from '../plugins/FathymCorePlugin.ts';

export const DefaultEaCConfig: EaCRuntimeConfig = {
  ModifierResolvers: {},
  Plugins: [new FathymCorePlugin()],
  Runtime: (cfg: EaCRuntimeConfig) => new DefaultEaCRuntime(cfg),
  EaC: { EnterpriseLookup: 'default-eac' },
  Server: {
    onListen: (params) => {
      const logger = getPackageLoggerSync();

      const address = colors.green(`http://localhost:${params.port}`);

      logger.info('');
      logger.info(colors.bgRgb24(' 🐙 EaC Runtime Ready ', fathymGreen));
      logger.info(colors.rgb24(`\t${address}`, fathymGreen));
      logger.info('');
    },
  },
};

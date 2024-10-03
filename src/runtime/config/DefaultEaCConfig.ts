import {
  colors,
  ConsoleHandler,
  getPackageLoggerSync,
  LevelName,
  Logger,
  LoggerConfig,
  LoggingProvider,
} from '../../src.deps.ts';
import { DefaultEaCRuntime } from '../DefaultEaCRuntime.ts';
import { EaCRuntimeConfig } from './EaCRuntimeConfig.ts';
import { fathymGreen } from '../../constants.ts';
import FathymCorePlugin from '../plugins/FathymCorePlugin.ts';

class DefaultLoggingProvider extends LoggingProvider {
  public get Default(): Logger {
    return this.LoggerSync();
  }

  public get Package(): Logger {
    return this.LoggerSync(undefined, true);
  }

  constructor() {
    const loggingPackages = [
      '@fathym/default',
      '@fathym/common/build',
      '@fathym/common/deno-kv',
      '@fathym/common/path',
      '@fathym/eac',
      '@fathym/eac-api',
      '@fathym/eac-api/client',
      '@fathym/eac-api/status',
      '@fathym/eac-runtime',
      '@fathym/atomic-icons',
      '@fathym/msal',
    ];

    const setupConfig = {
      handlers: {
        console: new ConsoleHandler('DEBUG'),
      },
      loggers: {
        default: {
          level: (Deno.env.get('LOGGING_DEFAULT_LEVEL') as LevelName) ?? 'DEBUG',
          handlers: ['console'],
        },

        ...loggingPackages.reduce((acc, name) => {
          const logLevelName = Deno.env.get('LOGGING_PACKAGE_LEVEL') ??
            Deno.env.get('LOGGING_DEFAULT_LEVEL') ??
            'DEBUG';

          acc[name] = {
            level: logLevelName as LevelName,
            handlers: ['console'],
          };
          return acc;
        }, {} as Record<string, LoggerConfig>),
      },
    };

    super(import.meta, setupConfig);
  }
}

export const DefaultEaCConfig: EaCRuntimeConfig = {
  LoggingProvider: new DefaultLoggingProvider(),
  ModifierResolvers: {},
  Plugins: [new FathymCorePlugin()],
  Runtime: (cfg: EaCRuntimeConfig) => new DefaultEaCRuntime(cfg),
  EaC: { EnterpriseLookup: 'default-eac' },
  Server: {
    onListen: (params) => {
      const logger = getPackageLoggerSync(import.meta);

      const address = colors.green(`http://localhost:${params.port}`);

      logger.info('');
      logger.info(colors.bgRgb24(' 🐙 EaC Runtime Ready ', fathymGreen));
      logger.info(colors.rgb24(`\t${address}`, fathymGreen));
      logger.info('');
    },
  },
};

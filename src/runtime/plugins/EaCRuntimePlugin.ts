import { EverythingAsCode, IoCContainer } from '../../src.deps.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export type EaCRuntimePlugin = {
  AfterEaCResolved?: (
    eac: EverythingAsCode,
    ioc: IoCContainer,
  ) => Promise<void>;

  Build?: (config: EaCRuntimeConfig) => Promise<EaCRuntimePluginConfig>;
};

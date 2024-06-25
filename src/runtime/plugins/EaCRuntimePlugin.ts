import { IoCContainer } from '../../src.deps.ts';
import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export type EaCRuntimePlugin<TEaC = EaCRuntimeEaC> = {
  AfterEaCResolved?: (
    eac: TEaC,
    ioc: IoCContainer,
  ) => Promise<void>;

  Build?: (
    eac: TEaC,
    ioc: IoCContainer,
    pluginCfg?: EaCRuntimePluginConfig<TEaC>,
  ) => Promise<void>;

  Setup: (
    config: EaCRuntimeConfig<TEaC>,
  ) => Promise<EaCRuntimePluginConfig<TEaC>>;
};

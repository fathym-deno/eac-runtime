import { EverythingAsCode, IoCContainer } from '../../src.deps.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export type EaCRuntimePlugin = {
  AfterEaCResolved?: (
    eac: EverythingAsCode,
    ioc: IoCContainer,
  ) => Promise<void>;

  Build?: () => Promise<EaCRuntimePluginConfig>;
};

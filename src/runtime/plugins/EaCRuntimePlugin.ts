import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export type EaCRuntimePlugin = {
  Build: () => Promise<EaCRuntimePluginConfig>;
};

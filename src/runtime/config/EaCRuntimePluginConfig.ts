import { EaCRuntimeSetupConfig } from './EaCRuntimeSetupConfig.ts';

export type EaCRuntimePluginConfig = {
  Name: string;
} & EaCRuntimeSetupConfig;

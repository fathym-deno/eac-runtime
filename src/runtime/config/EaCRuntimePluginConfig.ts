import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { EaCRuntimeSetupConfig } from './EaCRuntimeSetupConfig.ts';

export type EaCRuntimePluginConfig<TEaC = EaCRuntimeEaC> = {
  Name: string;
} & EaCRuntimeSetupConfig<TEaC>;

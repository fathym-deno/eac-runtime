import { EaCModifierResolverConfiguration, IoCContainer } from '../../src.deps.ts';
import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { EaCRuntimePluginDef } from './EaCRuntimePluginDef.ts';

export type EaCRuntimeSetupConfig<TEaC = EaCRuntimeEaC> = {
  EaC?: TEaC;

  IoC?: IoCContainer;

  ModifierResolvers?: Record<string, EaCModifierResolverConfiguration>;

  Plugins?: EaCRuntimePluginDef<TEaC>[];
};

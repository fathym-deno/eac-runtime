import { EaCModifierResolverConfiguration, IoCContainer } from '../../src.deps.ts';
import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { EaCRuntimePluginDefs } from './EaCRuntimePluginDefs.ts';

export type EaCRuntimeSetupConfig<TEaC = EaCRuntimeEaC> = {
  EaC?: TEaC;

  IoC?: IoCContainer;

  ModifierResolvers?: Record<string, EaCModifierResolverConfiguration>;

  Plugins?: EaCRuntimePluginDefs[];
};

import { EaCModifierResolverConfiguration, IoCContainer, LoggingProvider } from '../../src.deps.ts';
import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { EaCRuntimePluginDef } from './EaCRuntimePluginDef.ts';

export type EaCRuntimeSetupConfig<TEaC = EaCRuntimeEaC> = {
  EaC?: TEaC;

  IoC?: IoCContainer;

  LoggingProvider?: LoggingProvider;

  ModifierResolvers?: Record<string, EaCModifierResolverConfiguration>;

  Plugins?: EaCRuntimePluginDef<TEaC>[];
};

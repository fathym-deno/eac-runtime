import { EaCModifierResolverConfiguration, IoCContainer } from '../src.deps.ts';
import { EaCRuntimeEaC } from './EaCRuntimeEaC.ts';

export type EaCRuntime = {
  IoC: IoCContainer;

  EaC?: EaCRuntimeEaC;

  ModifierResolvers?: Record<string, EaCModifierResolverConfiguration>;

  Revision: number;

  Configure(configure?: (rt: EaCRuntime) => Promise<void>): Promise<void>;

  Handle: Deno.ServeHandler;
};

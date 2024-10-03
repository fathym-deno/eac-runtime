import { EaCModifierResolverConfiguration, IoCContainer } from '../src.deps.ts';
import { EaCRuntimeEaC } from './EaCRuntimeEaC.ts';

export type EaCRuntime<TEaC = EaCRuntimeEaC> = {
  IoC: IoCContainer;

  EaC?: TEaC;

  ModifierResolvers?: Record<string, EaCModifierResolverConfiguration>;

  Revision: number;

  Configure(options?: {
    configure?: (rt: EaCRuntime<TEaC>) => Promise<void>;
  }): Promise<void>;

  Handle: Deno.ServeHandler;
};

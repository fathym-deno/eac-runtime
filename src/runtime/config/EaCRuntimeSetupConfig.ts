import { IoCContainer } from '../../src.deps.ts';
import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { EaCRuntimePlugin } from '../plugins/EaCRuntimePlugin.ts';

export type EaCRuntimeSetupConfig = {
  EaC?: EaCRuntimeEaC;

  IoC?: IoCContainer;

  ModifierLookups?: string[];

  Plugins?: (EaCRuntimePlugin | [string, ...args: unknown[]])[];
};

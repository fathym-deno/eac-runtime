import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { EaCRuntimePlugin } from '../plugins/EaCRuntimePlugin.ts';

export type EaCRuntimePluginDef<TEaC = EaCRuntimeEaC> =
  | EaCRuntimePlugin<TEaC>
  | [string, ...args: unknown[]];

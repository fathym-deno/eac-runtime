import { EaCRuntimePlugin } from '../plugins/EaCRuntimePlugin.ts';

export type EaCRuntimePluginDef =
  | EaCRuntimePlugin
  | [string, ...args: unknown[]];

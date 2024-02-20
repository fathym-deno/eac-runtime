import { EaCApplicationAsCode, EaCApplicationLookupConfiguration } from '../src.deps.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';

export type EaCApplicationProcessorConfig = {
  Handlers: EaCRuntimeHandler[];

  LookupConfig: EaCApplicationLookupConfiguration;

  Pattern: URLPattern;

  ApplicationLookup: string;

  Application: EaCApplicationAsCode;
};

import {
  EaCApplicationAsCode,
  EaCApplicationLookupConfiguration,
} from '../src.deps.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';

export type EaCApplicationProcessorConfig = {
  Handler: EaCRuntimeHandler;

  LookupConfig: EaCApplicationLookupConfiguration;

  Pattern: URLPattern;

  ApplicationLookup: string;

  Application: EaCApplicationAsCode;
};

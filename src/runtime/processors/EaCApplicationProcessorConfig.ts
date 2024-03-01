import { EaCApplicationAsCode, EaCApplicationResolverConfiguration } from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export type EaCApplicationProcessorConfig = {
  Handlers: EaCRuntimeHandler[];

  ResolverConfig: EaCApplicationResolverConfiguration;

  Pattern: URLPattern;

  ApplicationLookup: string;

  Application: EaCApplicationAsCode;
};

import { EaCApplicationAsCode, EaCApplicationResolverConfiguration } from '../../src.deps.ts';
import { EaCRuntimeHandlerPipeline } from '../EaCRuntimeHandlerPipeline.ts';

export type EaCApplicationProcessorConfig = {
  Handlers: EaCRuntimeHandlerPipeline;

  ResolverConfig: EaCApplicationResolverConfiguration;

  Pattern: URLPattern;

  ApplicationLookup: string;

  Application: EaCApplicationAsCode;
};

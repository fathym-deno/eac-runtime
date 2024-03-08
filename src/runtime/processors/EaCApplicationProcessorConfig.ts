import { EaCApplicationAsCode, EaCApplicationResolverConfiguration } from '../../src.deps.ts';
import { EaCRuntimeHandlerPipeline } from '../EaCRuntimeHandlerPipeline.ts';

export type EaCApplicationProcessorConfig = {
  ApplicationLookup: string;

  Application: EaCApplicationAsCode;

  Handlers: EaCRuntimeHandlerPipeline;

  Pattern: URLPattern;

  ResolverConfig: EaCApplicationResolverConfiguration;

  Revision: number;
};

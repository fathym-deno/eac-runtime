import { EaCProjectAsCode } from '../src.deps.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';

export type EaCProjectProcessorConfig = {
  Handler: EaCRuntimeHandler;

  Patterns: URLPattern[];

  ProjectLookup: string;

  Project: EaCProjectAsCode;
};

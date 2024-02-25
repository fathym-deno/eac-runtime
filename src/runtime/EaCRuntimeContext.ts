import { IoCContainer } from '../src.deps.ts';
import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCProjectProcessorConfig } from './EaCProjectProcessorConfig.ts';
import { EaCRuntimeEaC } from './EaCRuntimeEaC.ts';
import { EaCRuntimeConfig } from './config/EaCRuntimeConfig.ts';

export type EaCRuntimeContext = {
  ApplicationProcessorConfig: EaCApplicationProcessorConfig;

  Config: EaCRuntimeConfig;

  // Databases: Record<string, unknown>;

  EaC: EaCRuntimeEaC;

  Info: Deno.ServeHandlerInfo;

  IoC: IoCContainer;

  next: (req?: Request) => Response | Promise<Response>;

  ProjectProcessorConfig: EaCProjectProcessorConfig;

  Revision: number;
};

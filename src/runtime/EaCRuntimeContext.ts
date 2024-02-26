import { IoCContainer } from '../src.deps.ts';
import { EaCApplicationProcessorConfig } from './processors/EaCApplicationProcessorConfig.ts';
import { EaCProjectProcessorConfig } from './processors/EaCProjectProcessorConfig.ts';
import { EaCRuntimeEaC } from './EaCRuntimeEaC.ts';
import { EaCRuntimeConfig } from './config/EaCRuntimeConfig.ts';

export type EaCRuntimeContext = {
  ApplicationProcessorConfig: EaCApplicationProcessorConfig;

  Config: EaCRuntimeConfig;

  EaC: EaCRuntimeEaC;

  Info: Deno.ServeHandlerInfo;

  IoC: IoCContainer;

  next: (req?: Request) => Response | Promise<Response>;

  ProjectProcessorConfig: EaCProjectProcessorConfig;

  Revision: number;
};

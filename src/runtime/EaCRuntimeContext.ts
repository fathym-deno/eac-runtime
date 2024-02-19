import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCProjectProcessorConfig } from './EaCProjectProcessorConfig.ts';

export type EaCRuntimeContext = {
  ApplicationProcessorConfig: EaCApplicationProcessorConfig;

  Databases: Record<string, unknown>;

  Info: Deno.ServeHandlerInfo;

  next: (req?: Request) => Response | Promise<Response>;

  ProjectProcessorConfig: EaCProjectProcessorConfig;

  Revision: number;
};

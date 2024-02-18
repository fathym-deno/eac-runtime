import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCProjectProcessorConfig } from './EaCProjectProcessorConfig.ts';

export type EaCRuntimeContext = {
  ApplicationProcessorConfig: EaCApplicationProcessorConfig;

  Info: Deno.ServeHandlerInfo;

  next: (req?: Request) => Response | Promise<Response>;

  ProjectProcessorConfig: EaCProjectProcessorConfig;

  Revision: number;
};

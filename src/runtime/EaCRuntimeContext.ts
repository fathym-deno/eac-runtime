import { IoCContainer } from '../src.deps.ts';
import { EaCApplicationProcessorConfig } from './processors/EaCApplicationProcessorConfig.ts';
import { EaCProjectProcessorConfig } from './processors/EaCProjectProcessorConfig.ts';
import { EaCRuntimeEaC } from './EaCRuntimeEaC.ts';
import { EaCRuntimeConfig } from './config/EaCRuntimeConfig.ts';
import { URLMatch } from './URLMatch.ts';

export type EaCRuntimeContext<
  TState = Record<string, unknown>,
  TData = Record<string, unknown>,
> = {
  Data: TData;

  Next: (req?: Request) => Response | Promise<Response>;

  Params: Record<string, string | undefined>;

  Render: (data?: TData) => Response | Promise<Response>;

  Runtime: {
    ApplicationProcessorConfig: EaCApplicationProcessorConfig;

    Config: EaCRuntimeConfig;

    EaC: EaCRuntimeEaC;

    Info: Deno.ServeHandlerInfo;

    IoC: IoCContainer;

    ProjectProcessorConfig: EaCProjectProcessorConfig;

    Revision: number;

    URLMatch: URLMatch;
  };

  State: TState;
};

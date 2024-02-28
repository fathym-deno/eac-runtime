import { IoCContainer } from '../../src.deps.ts';
import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export type AppHandlerResolver = {
  Resolve: (
    ioc: IoCContainer,
    appProcCfg: EaCApplicationProcessorConfig,
  ) => Promise<EaCRuntimeHandler>;
};

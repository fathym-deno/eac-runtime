import { IoCContainer } from '../../src.deps.ts';
import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export type ProcessorHandlerResolver = {
  Resolve: (
    ioc: IoCContainer,
    appProcCfg: EaCApplicationProcessorConfig,
  ) => Promise<EaCRuntimeHandler>;
};

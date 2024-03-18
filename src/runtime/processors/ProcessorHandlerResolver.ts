import { IoCContainer } from '../../src.deps.ts';
import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export type ProcessorHandlerResolver = {
  Resolve: (
    ioc: IoCContainer,
    appProcCfg: EaCApplicationProcessorConfig,
    eac: EaCRuntimeEaC,
  ) => Promise<EaCRuntimeHandler | undefined>;
};

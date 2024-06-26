import { IoCContainer } from '../../src.deps.ts';
import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export type ProcessorHandlerResolver<TEaC = EaCRuntimeEaC> = {
  Resolve: (
    ioc: IoCContainer,
    appProcCfg: EaCApplicationProcessorConfig,
    eac: TEaC,
  ) => Promise<EaCRuntimeHandler | undefined>;
};

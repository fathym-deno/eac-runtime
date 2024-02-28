import { EaCModifierAsCode, IoCContainer } from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export type ModifierHandlerResolver = {
  Resolve: (
    ioc: IoCContainer,
    modifier: EaCModifierAsCode,
  ) => Promise<EaCRuntimeHandler | undefined>;
};

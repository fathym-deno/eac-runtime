import { EaCRuntimeContext } from './EaCRuntimeContext.ts';

export type EaCRuntimeHandler = (
  request: Request,
  ctx: EaCRuntimeContext,
) => Response | Promise<Response>;

// deno-lint-ignore-file no-explicit-any
import {
  EaCLicenseStripeDetails,
  EaCStripeProcessor,
  isEaCStripeProcessor,
  loadEaCSvc,
  STATUS_CODE,
  Stripe,
} from '../../src.deps.ts';
import { EaCRuntimeContext } from '../EaCRuntimeContext.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';

export const EaCStripeProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, appProcCfg, eac) {
    if (!isEaCStripeProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCStripeProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCStripeProcessor;

    const license = eac.Licenses![processor.LicenseLookup]!;

    const licDetails = license.Details as EaCLicenseStripeDetails;

    const stripe = (Stripe as any)(licDetails.SecretKey)!;

    // const licenseKv = await ioc.Resolve(Deno.Kv, processor.DatabaseLookup);

    return Promise.resolve(
      async (
        req,
        ctx: EaCRuntimeContext<{
          Username?: string;
        }>,
      ) => {
        const username = ctx.State.Username as string;

        if (!username) {
          throw new Deno.errors.NotFound(
            'A `ctx.State.Username` value must be provided.',
          );
        }

        const customers = await stripe.customers.search({
          query: `email:"${username}"`,
          limit: 1,
        });

        let customer = customers.data[0];

        if (!customer) {
          customer = await stripe.customers.create({
            email: username,
          });
        }

        const parentEaCSvc = await loadEaCSvc();

        const jwt = await parentEaCSvc.JWT(
          ctx.Runtime.EaC.EnterpriseLookup!,
          username,
        );

        const eacSvc = await loadEaCSvc(jwt.Token);

        if (
          req.method.toUpperCase() === 'POST' &&
          ctx.Runtime.URLMatch.Path === 'subscribe'
        ) {
          const inpReq = (await req.json()) as {
            LicenseLookup: string;

            PlanLookup: string;

            PriceLookup: string;
          };

          try {
            const licSubRes = await eacSvc.LicenseSubscription(
              ctx.Runtime.EaC.EnterpriseLookup!,
              inpReq.LicenseLookup,
              inpReq.PlanLookup,
              inpReq.PriceLookup,
            );

            return Response.json(licSubRes);
          } catch (error) {
            return Response.json(error, {
              status: STATUS_CODE.BadRequest,
            });
          }
          // } else if (ctx.Runtime.URLMatch.Path === 'webhooks') {
        }

        return ctx.Next();
      },
    );
  },
};

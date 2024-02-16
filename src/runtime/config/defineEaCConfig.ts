import { djwt, isEaCOAuthProcessor } from '../../src.deps.ts';
import {
  isEaCRedirectProcessor,
  isEaCProxyProcessor,
  oAuthRequest,
  proxyRequest,
  redirectRequest,
} from '../../src.deps.ts';
import { merge, colors } from '../../src.deps.ts';
import { isPromise } from '../../utils/type-guards/isPromise.ts';
import { DefaultEaCRuntime } from '../DefaultEaCRuntime.ts';
import { EaCRuntimeConfig } from './EaCRuntimeConfig.ts';

export const DefaultEaCConfig: EaCRuntimeConfig = {
  ApplicationHandlerResolver: (appProcCfg) => {
    return (req, ctx) => {
      if (isEaCRedirectProcessor(appProcCfg.Application.Processor)) {
        return redirectRequest(
          appProcCfg.Application.Processor.Redirect,
          appProcCfg.Application.Processor.PreserveMethod,
          appProcCfg.Application.Processor.Permanent
        );
      } else if (isEaCProxyProcessor(appProcCfg.Application.Processor)) {
        return proxyRequest(
          req,
          appProcCfg.Application.Processor.ProxyRoot,
          appProcCfg.LookupConfig.PathPattern
          // ctx.Info.remoteAddr.hostname,
        );
      } else if (isEaCOAuthProcessor(appProcCfg.Application.Processor)) {
        return oAuthRequest(
          req,
          appProcCfg.Application.Processor.ClientID,
          appProcCfg.Application.Processor.ClientSecret,
          appProcCfg.Application.Processor.AuthorizationEndpointURI,
          appProcCfg.Application.Processor.TokenURI,
          appProcCfg.Application.Processor.Scopes,
          async (tokens, newSessionId, oldSessionId) => {
            const { accessToken, refreshToken, expiresIn } = tokens;
      
            const [header, payload, signature] = await djwt.decode(accessToken);

            payload?.toString();
          },
          appProcCfg.LookupConfig.PathPattern
        );
      }

      return new Response(
        'Hello, world!\n' +
          JSON.stringify(appProcCfg, null, 2) +
          '\n' +
          JSON.stringify(ctx.Info.remoteAddr, null, 2)
      );
    };
  },
  Runtime: (cfg: EaCRuntimeConfig) => new DefaultEaCRuntime(cfg),
  Server: {
    onListen: (params) => {
      const address = colors.green(`http://localhost:${params.port}`);

      const fathymGreen: colors.Rgb = { r: 74, g: 145, b: 142 };

      console.log();
      console.log(colors.bgRgb24(' 🔥 EaC Runtime Ready ', fathymGreen));
      console.log(colors.rgb24(`\t${address}`, fathymGreen));
      console.log();
    },
  },
};

export async function defineEaCConfig(
  config: Partial<EaCRuntimeConfig> | Promise<Partial<EaCRuntimeConfig>>
): Promise<EaCRuntimeConfig> {
  if (isPromise(config)) {
    config = await config;
  }

  return merge(DefaultEaCConfig, config);
}

import { djwt } from '../src.deps.ts';
import {
  EverythingAsCode,
  EverythingAsCodeApplications,
  loadEaCSvc,
  merge,
} from '../src.deps.ts';
import { EaCRuntimeConfig } from './config/EaCRuntimeConfig.ts';
import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCProjectProcessorConfig } from './EaCProjectProcessorConfig.ts';
import { EaCRuntime } from './EaCRuntime.ts';
import { EaCRuntimeContext } from './EaCRuntimeContext.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';

export class DefaultEaCRuntime implements EaCRuntime {
  protected applicationGraph?: Record<string, EaCApplicationProcessorConfig[]>;

  protected eac?: EverythingAsCode & EverythingAsCodeApplications;

  protected projectGraph?: EaCProjectProcessorConfig[];

  protected revision?: number;

  constructor(protected config: EaCRuntimeConfig) {
    this.revision = Date.now();
  }

  public async Configure(): Promise<void> {
    const eacApiKey = Deno.env.get('EAC_API_KEY');

    if (eacApiKey) {
      const [_header, payload] = await djwt.decode(eacApiKey);

      const { EnterpriseLookup } = payload as Record<string, unknown>;

      const eacSvc = await loadEaCSvc(eacApiKey);

      const eac = await eacSvc.Get(EnterpriseLookup as string);

      this.eac = merge(this.config.EaC || {}, eac);
    } else if (this.config.EaC) {
      this.eac = this.config.EaC;
    } else {
      throw new Error(
        'An EaC must be provided in the config or via a connection to an EaC Service with the EAC_API_KEY environment variable.'
      );
    }

    if (!this.eac.Projects) {
      throw new Error(
        'The EaC must provide a set of projects to use in the runtime.'
      );
    }

    this.buildProjectGraph();

    this.buildApplicationGraph();
  }

  public Handle(
    request: Request,
    info: Deno.ServeHandlerInfo
  ): Response | Promise<Response> {
    const projProcessorConfig = this.projectGraph!.find((node) => {
      return node.Patterns.some((pattern) => pattern.test(request.url));
    });

    if (!projProcessorConfig) {
      throw new Error(`No project is configured for '${request.url}'.`);
    }

    const resp = projProcessorConfig.Handler(request, {
      Info: info,
      ProjectProcessorConfig: projProcessorConfig,
      Revision: this.revision,
    } as EaCRuntimeContext);

    return resp;
  }

  protected buildApplicationGraph(): void {
    if (this.eac!.Applications) {
      this.applicationGraph = this.projectGraph!.reduce(
        (appGraph, projNode) => {
          const appLookups = Object.keys(
            projNode.Project.ApplicationLookups || {}
          );

          appGraph[projNode.ProjectLookup] = appLookups
            .map((appLookup) => {
              const app = this.eac!.Applications![appLookup];

              if (!app) {
                throw new Error(
                  `The '${appLookup}' app configured for the project does not exist in the EaC Applications configuration.`
                );
              }

              const lookupCfg = projNode.Project.ApplicationLookups[appLookup];

              return {
                Application: app,
                ApplicationLookup: appLookup,
                LookupConfig: lookupCfg,
                Pattern: new URLPattern({ pathname: lookupCfg.PathPattern }),
              } as EaCApplicationProcessorConfig;
            })
            .map((appProcCfg) => {
              return {
                ...appProcCfg,
                Handler: this.establishApplicationHandler(appProcCfg),
              };
            })
            .sort((a, b) => {
              return b.LookupConfig.Priority - a.LookupConfig.Priority;
            });

          return appGraph;
        },
        {} as Record<string, EaCApplicationProcessorConfig[]>
      );
    }
  }

  protected buildProjectGraph(): void {
    if (this.eac!.Projects) {
      const projLookups = Object.keys(this.eac?.Projects || {});

      this.projectGraph = projLookups
        .map((projLookup) => {
          const proj = this.eac!.Projects![projLookup];

          const lookupKeys = Object.keys(proj.LookupConfigs);

          return {
            Project: proj,
            ProjectLookup: projLookup,
            Patterns: lookupKeys.map((lk) => {
              const lookupCfg = proj.LookupConfigs[lk];

              return new URLPattern({
                hostname: lookupCfg.Hostname,
                port: lookupCfg.Port?.toString(),
              });
            }),
          } as EaCProjectProcessorConfig;
        })
        .map((projProcCfg) => {
          return {
            ...projProcCfg,
            Handler: this.establishProjectHandler(projProcCfg),
          };
        })
        .sort((a, b) => {
          return b.Project.Details!.Priority - a.Project.Details!.Priority;
        });
    }
  }

  protected constructPipeline(ctx: EaCRuntimeContext): EaCRuntimeHandler[] {
    const pipeline: EaCRuntimeHandler[] = [];

    // TODO(mcgear): Add application logic middlewares to pipeline

    // TODO(mcgear): Add project and application modifier middlewares to pipeline

    pipeline.push(...(this.config.Middleware || []));

    pipeline.push(ctx.ApplicationProcessorConfig.Handler);

    return pipeline;
  }

  protected establishApplicationHandler(
    appProcessorConfig: EaCApplicationProcessorConfig
  ): EaCRuntimeHandler {
    return this.config.ApplicationHandlerResolver(appProcessorConfig);
  }

  protected establishProjectHandler(
    projProcessorConfig: EaCProjectProcessorConfig
  ): EaCRuntimeHandler {
    return (req, ctx) => {
      const appProcessorConfig = this.applicationGraph![
        projProcessorConfig.ProjectLookup
      ].find((node) => {
        return node.Pattern.test(req.url);
      });

      if (!appProcessorConfig) {
        throw new Error(
          `No application is configured for '${req.url}' in project '${projProcessorConfig.ProjectLookup}'.`
        );
      }

      ctx.ApplicationProcessorConfig = appProcessorConfig;

      const pipeline: EaCRuntimeHandler[] = this.constructPipeline(ctx);

      return this.executePipeline(pipeline, req, ctx);
    };
  }

  protected executePipeline(
    pipeline: EaCRuntimeHandler[],
    request: Request,
    ctx: EaCRuntimeContext
  ): Response | Promise<Response> {
    ctx.next = (req) => {
      req ??= request;

      if (pipeline.length > 0) {
        const response = pipeline.shift()!(req, ctx);

        if (response) {
          return response;
        } else {
          return this.executePipeline(pipeline, req, ctx);
        }
      } else {
        throw new Error('A Response must be returned from the pipeline.');
      }
    };

    return ctx.next(request);
  }
}

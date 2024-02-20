import { djwt, initializeDenoKv } from '../src.deps.ts';
import { EaCDenoKVDatabaseDetails } from '../src.deps.ts';
import { EaCApplicationAsCode } from '../src.deps.ts';
import { EaCProjectAsCode } from '../src.deps.ts';
import { EaCModifierAsCode } from '../src.deps.ts';
import { isEaCDenoKVDatabaseDetails } from '../src.deps.ts';
import { loadEaCSvc, mergeWithArrays } from '../src.deps.ts';
import { EaCRuntimeConfig } from './config/EaCRuntimeConfig.ts';
import { defaultModifierMiddlewareResolver } from './defaultModifierMiddlewareResolver.ts';
import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCProjectProcessorConfig } from './EaCProjectProcessorConfig.ts';
import { EaCRuntime } from './EaCRuntime.ts';
import { EaCRuntimeContext } from './EaCRuntimeContext.ts';
import { EaCRuntimeEaC } from './EaCRuntimeEaC.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';

export class DefaultEaCRuntime implements EaCRuntime {
  protected applicationGraph?: Record<string, EaCApplicationProcessorConfig[]>;

  protected databases: Record<string, Promise<unknown>>;

  protected eac?: EaCRuntimeEaC;

  protected projectGraph?: EaCProjectProcessorConfig[];

  protected revision: number;

  constructor(protected config: EaCRuntimeConfig) {
    this.databases = {};

    this.revision = Date.now();
  }

  public async Configure(): Promise<void> {
    const eacApiKey = Deno.env.get('EAC_API_KEY');

    if (eacApiKey) {
      try {
        const [_header, payload] = await djwt.decode(eacApiKey);

        const { EnterpriseLookup } = payload as Record<string, unknown>;

        const eacSvc = await loadEaCSvc(eacApiKey);

        const eac = await eacSvc.Get(EnterpriseLookup as string);

        this.eac = mergeWithArrays(this.config.EaC || {}, eac);
      } catch (err) {
        console.error('Unable to connect to the EaC service, falling back to local config.');
        console.error(err);

        this.eac = this.config.EaC;
      }
    } else if (this.config.EaC) {
      this.eac = this.config.EaC;
    } else {
      throw new Error(
        'An EaC must be provided in the config or via a connection to an EaC Service with the EAC_API_KEY environment variable.'
      );
    }

    if (!this.eac!.Projects) {
      throw new Error(
        'The EaC must provide a set of projects to use in the runtime.'
      );
    }

    this.configureDatabases();

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
      Config: this.config,
      Databases: this.databases,
      EaC: this.eac,
      Info: info,
      ProjectProcessorConfig: projProcessorConfig,
      Revision: this.revision,
    } as EaCRuntimeContext);

    return resp;
  }

  protected buildApplicationGraph(): void {
    if (this.eac!.Applications) {
      this.applicationGraph = this.projectGraph!.reduce(
        (appGraph, projProcCfg) => {
          const appLookups = Object.keys(
            projProcCfg.Project.ApplicationLookups || {}
          );

          appGraph[projProcCfg.ProjectLookup] = appLookups
            .map((appLookup) => {
              const app = this.eac!.Applications![appLookup];

              if (!app) {
                throw new Error(
                  `The '${appLookup}' app configured for the project does not exist in the EaC Applications configuration.`
                );
              }

              const lookupCfg =
                projProcCfg.Project.ApplicationLookups[appLookup];

              return {
                Application: app,
                ApplicationLookup: appLookup,
                LookupConfig: lookupCfg,
                Pattern: new URLPattern({ pathname: lookupCfg.PathPattern }),
              } as EaCApplicationProcessorConfig;
            })
            .map((appProcCfg) => {
              const pipeline: EaCRuntimeHandler[] = this.constructPipeline(
                projProcCfg.Project,
                appProcCfg.Application,
                this.eac!.Modifiers || {}
              );

              pipeline.push(this.establishApplicationHandler(appProcCfg));

              return {
                ...appProcCfg,
                Handlers: pipeline,
              } as EaCApplicationProcessorConfig;
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

  protected configureDatabases(): void {
    const dbLookups = Object.keys(this.eac!.Databases || {});

    dbLookups.forEach((dbLookup) => {
      const db = this.eac!.Databases![dbLookup];

      if (isEaCDenoKVDatabaseDetails(db.Details)) {
        const dbInit = new Promise<Deno.Kv>((resolve) => {
          const dbDetails = db.Details as EaCDenoKVDatabaseDetails;

          initializeDenoKv(dbDetails.DenoKVPath).then((kv) => {
            resolve(kv);
          });
        });

        dbInit.then();

        this.databases[dbLookup] = dbInit;
      }
    });
  }

  protected constructPipeline(
    project: EaCProjectAsCode,
    application: EaCApplicationAsCode,
    modifiers: Record<string, EaCModifierAsCode>
  ): EaCRuntimeHandler[] {
    const pipelineModifierLookups: string[] = [];

    pipelineModifierLookups.push(...(this.config.ModifierLookups || []));

    // TODO(mcgear): Add application logic middlewares to pipeline

    pipelineModifierLookups.push(...(project.ModifierLookups || []));

    pipelineModifierLookups.push(...(application.ModifierLookups || []));

    const pipelineModifiers: EaCModifierAsCode[] = [];

    pipelineModifierLookups?.forEach((ml) => {
      if (ml in modifiers) {
        pipelineModifiers.push(modifiers[ml]);
      }
    });

    const pipeline: (EaCRuntimeHandler | undefined)[] = [];

    pipelineModifiers
      .sort((a, b) => b.Details!.Priority - a.Details!.Priority)
      .forEach((mod) => {
        pipeline.push(defaultModifierMiddlewareResolver(mod));
      });

    return pipeline.filter((p) => p).map((p) => p!);
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
        const appLookupConfig =
          projProcessorConfig.Project.ApplicationLookups[
            node.ApplicationLookup
          ];

        const isAllowedMethod =
          !appLookupConfig.AllowedMethods ||
          appLookupConfig.AllowedMethods.length === 0 ||
          appLookupConfig.AllowedMethods.some(
            (am) => am.toLowerCase() === req.method.toLowerCase()
          );

        return node.Pattern.test(req.url) && isAllowedMethod;
      });

      if (!appProcessorConfig) {
        throw new Error(
          `No application is configured for '${req.url}' in project '${projProcessorConfig.ProjectLookup}'.`
        );
      }

      ctx.ApplicationProcessorConfig = appProcessorConfig;

      return this.executePipeline(
        ctx.ApplicationProcessorConfig.Handlers,
        req,
        ctx
      );
    };
  }

  protected executePipeline(
    pipeline: EaCRuntimeHandler[],
    request: Request,
    ctx: EaCRuntimeContext,
    index = -1
  ): Response | Promise<Response> {
    ctx.next = async (req) => {
      req ??= request;

      ++index;

      if (pipeline.length > index) {
        const response = await pipeline[index](req, ctx);

        if (response) {
          return response;
        } else {
          return this.executePipeline(pipeline, req, ctx, index);
        }
      } else {
        throw new Error('A Response must be returned from the pipeline.');
      }
    };

    return ctx.next(request);
  }
}

import {
  EaCApplicationAsCode,
  EaCModifierAsCode,
  EaCModifierResolverConfiguration,
  EaCProjectAsCode,
  IoCContainer,
  merge,
  mergeWithArrays,
} from '../src.deps.ts';
import { EaCRuntimeConfig } from './config/EaCRuntimeConfig.ts';
import { ProcessorHandlerResolver } from './processors/ProcessorHandlerResolver.ts';
import { ModifierHandlerResolver } from './modifiers/ModifierHandlerResolver.ts';
import { EaCApplicationProcessorConfig } from './processors/EaCApplicationProcessorConfig.ts';
import { EaCProjectProcessorConfig } from './processors/EaCProjectProcessorConfig.ts';
import { EaCRuntime } from './EaCRuntime.ts';
import { EaCRuntimeContext } from './EaCRuntimeContext.ts';
import { EaCRuntimeEaC } from './EaCRuntimeEaC.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';
import { EaCRuntimePlugin } from './plugins/EaCRuntimePlugin.ts';

export class DefaultEaCRuntime implements EaCRuntime {
  protected applicationGraph?: Record<string, EaCApplicationProcessorConfig[]>;

  protected eac?: EaCRuntimeEaC;

  protected ioc: IoCContainer;

  protected modifierResolvers?: Record<
    string,
    EaCModifierResolverConfiguration
  >;

  protected projectGraph?: EaCProjectProcessorConfig[];

  protected revision: number;

  constructor(protected config: EaCRuntimeConfig) {
    this.ioc = new IoCContainer();

    this.revision = Date.now();
  }

  public async Configure(): Promise<void> {
    this.eac = this.config.EaC;

    this.ioc = this.config.IoC || new IoCContainer();

    this.modifierResolvers = this.config.ModifierResolvers || {};

    await this.configurePlugins(this.config.Plugins);

    if (!this.eac) {
      throw new Error(
        'An EaC must be provided in the config or via a connection to an EaC Service with the EAC_API_KEY environment variable.',
      );
    }

    if (!this.eac!.Projects) {
      throw new Error(
        'The EaC must provide a set of projects to use in the runtime.',
      );
    }

    this.revision = Date.now();

    await this.afterEaCResolved(this.config.Plugins);

    this.buildProjectGraph();

    await this.buildApplicationGraph();
  }

  public Handle(
    request: Request,
    info: Deno.ServeHandlerInfo,
  ): Response | Promise<Response> {
    const projProcessorConfig = this.projectGraph!.find((node) => {
      return node.Patterns.some((pattern) => pattern.test(request.url));
    });

    if (!projProcessorConfig) {
      throw new Error(`No project is configured for '${request.url}'.`);
    }

    const resp = projProcessorConfig.Handler(request, {
      Runtime: {
        Config: this.config,
        EaC: this.eac,
        Info: info,
        IoC: this.ioc,
        ProjectProcessorConfig: projProcessorConfig,
        Revision: this.revision,
      },
    } as EaCRuntimeContext);

    return resp;
  }

  protected async afterEaCResolved(
    plugins?: (EaCRuntimePlugin | [string, ...args: unknown[]])[],
  ): Promise<void> {
    for (let pluginDef of plugins || []) {
      if (Array.isArray(pluginDef)) {
        const [plugin, ...args] = pluginDef;

        pluginDef = new (await import(plugin)).default(
          args,
        ) as EaCRuntimePlugin;
      }

      if (pluginDef.AfterEaCResolved) {
        await pluginDef.AfterEaCResolved(this.eac!, this.ioc);
      }

      const pluginConfig = pluginDef.Build ? await pluginDef.Build(this.config) : undefined;

      if (pluginConfig) {
        await this.afterEaCResolved(pluginConfig.Plugins);
      }
    }
  }

  protected async buildApplicationGraph(): Promise<void> {
    if (this.eac!.Applications) {
      this.applicationGraph = {} as Record<
        string,
        EaCApplicationProcessorConfig[]
      >;

      for (const projProcCfg of this.projectGraph!) {
        const appLookups = Object.keys(
          projProcCfg.Project.ApplicationResolvers || {},
        );

        this.applicationGraph[projProcCfg.ProjectLookup] = appLookups
          .map((appLookup) => {
            const app = this.eac!.Applications![appLookup];

            if (!app) {
              throw new Error(
                `The '${appLookup}' app configured for the project does not exist in the EaC Applications configuration.`,
              );
            }

            const resolverCfg = projProcCfg.Project.ApplicationResolvers[appLookup];

            return {
              Application: app,
              ApplicationLookup: appLookup,
              ResolverConfig: resolverCfg,
              Pattern: new URLPattern({ pathname: resolverCfg.PathPattern }),
            } as EaCApplicationProcessorConfig;
          })
          .sort((a, b) => {
            return b.ResolverConfig.Priority - a.ResolverConfig.Priority;
          });

        for (
          const appProcCfg of this.applicationGraph[
            projProcCfg.ProjectLookup
          ]
        ) {
          const pipeline: EaCRuntimeHandler[] = await this.constructPipeline(
            projProcCfg.Project,
            appProcCfg.Application,
            this.eac!.Modifiers || {},
          );

          pipeline.push(await this.establishApplicationHandler(appProcCfg));

          appProcCfg.Handlers = pipeline;
        }
      }
    }
  }

  protected buildProjectGraph(): void {
    if (this.eac!.Projects) {
      const projLookups = Object.keys(this.eac?.Projects || {});

      this.projectGraph = projLookups
        .map((projLookup) => {
          const proj = this.eac!.Projects![projLookup];

          const resolverKeys = Object.keys(proj.ResolverConfigs);

          return {
            Project: proj,
            ProjectLookup: projLookup,
            Patterns: resolverKeys.map((lk) => {
              const resolverCfg = proj.ResolverConfigs[lk];

              return new URLPattern({
                hostname: resolverCfg.Hostname,
                port: resolverCfg.Port?.toString(),
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

  protected async configurePlugins(
    plugins?: (EaCRuntimePlugin | [string, ...args: unknown[]])[],
  ): Promise<void> {
    for (let pluginDef of plugins || []) {
      if (Array.isArray(pluginDef)) {
        const [plugin, ...args] = pluginDef;

        pluginDef = new (await import(plugin)).default(
          args,
        ) as EaCRuntimePlugin;
      }

      const pluginConfig = pluginDef.Build ? await pluginDef.Build(this.config) : undefined;

      if (pluginConfig) {
        if (pluginConfig.EaC) {
          this.eac = mergeWithArrays(this.eac || {}, pluginConfig.EaC);
        }

        if (pluginConfig.IoC) {
          pluginConfig.IoC.CopyTo(this.ioc!);
        }

        if (pluginConfig.ModifierResolvers) {
          this.modifierResolvers = merge(
            this.modifierResolvers || {},
            pluginConfig.ModifierResolvers,
          );
        }

        await this.configurePlugins(pluginConfig.Plugins);
      }
    }
  }

  protected async constructPipeline(
    project: EaCProjectAsCode,
    application: EaCApplicationAsCode,
    modifiers: Record<string, EaCModifierAsCode>,
  ): Promise<EaCRuntimeHandler[]> {
    let pipelineModifierResolvers: Record<
      string,
      EaCModifierResolverConfiguration
    > = {};

    pipelineModifierResolvers = merge(
      pipelineModifierResolvers,
      this.modifierResolvers || {},
    );

    // TODO(mcgear): Add application logic middlewares to pipeline

    pipelineModifierResolvers = merge(
      pipelineModifierResolvers,
      project.ModifierResolvers || {},
    );

    pipelineModifierResolvers = merge(
      pipelineModifierResolvers,
      application.ModifierResolvers || {},
    );

    const pipelineModifiers: EaCModifierAsCode[] = [];

    const modifierLookups = Object.keys(pipelineModifierResolvers);

    modifierLookups
      .map((ml) => ({
        Lookup: ml,
        Config: pipelineModifierResolvers[ml],
      }))
      .sort((a, b) => b.Config.Priority - a.Config.Priority)
      .forEach((ml) => {
        if (ml.Lookup in modifiers) {
          pipelineModifiers.push(modifiers[ml.Lookup]);
        }
      });

    const pipeline: (EaCRuntimeHandler | undefined)[] = [];

    const defaultModifierMiddlewareResolver = await this.ioc.Resolve<ModifierHandlerResolver>(
      this.ioc.Symbol('ModifierHandlerResolver'),
    );

    for (const mod of pipelineModifiers) {
      pipeline.push(
        await defaultModifierMiddlewareResolver.Resolve(this.ioc, mod),
      );
    }

    return pipeline.filter((p) => p).map((p) => p!);
  }

  protected async establishApplicationHandler(
    appProcessorConfig: EaCApplicationProcessorConfig,
  ): Promise<EaCRuntimeHandler> {
    const defaultProcessorHandlerResolver = await this.ioc.Resolve<ProcessorHandlerResolver>(
      this.ioc.Symbol('ProcessorHandlerResolver'),
    );

    return await defaultProcessorHandlerResolver.Resolve(
      this.ioc,
      appProcessorConfig,
    );
  }

  protected establishProjectHandler(
    projProcessorConfig: EaCProjectProcessorConfig,
  ): EaCRuntimeHandler {
    return (req, ctx) => {
      const appProcessorConfig = this.applicationGraph![
        projProcessorConfig.ProjectLookup
      ].find((node) => {
        const appResolverConfig = projProcessorConfig.Project.ApplicationResolvers[
          node.ApplicationLookup
        ];

        const isAllowedMethod = !appResolverConfig.AllowedMethods ||
          appResolverConfig.AllowedMethods.length === 0 ||
          appResolverConfig.AllowedMethods.some(
            (arc) => arc.toLowerCase() === req.method.toLowerCase(),
          );

        const matchesRegex = !appResolverConfig.UserAgentRegex ||
          new RegExp(appResolverConfig.UserAgentRegex).test(
            req.headers.get('user-agent') || '',
          );

        // TODO(mcgear): How to account for IsPrivate/IsTriggerSignIn during application resolution...
        //    Maybe return a list of available apps, so their handlers can be nexted through
        //    Think through logic, as this already may be happening based on configs?...

        return node.Pattern.test(req.url) && isAllowedMethod && matchesRegex;
      });

      if (!appProcessorConfig) {
        throw new Error(
          `No application is configured for '${req.url}' in project '${projProcessorConfig.ProjectLookup}'.`,
        );
      }

      ctx.Runtime.ApplicationProcessorConfig = appProcessorConfig;

      const pattern = new URLPattern({
        pathname: ctx.Runtime.ApplicationProcessorConfig.ResolverConfig.PathPattern,
      });

      const reqUrl = new URL(req.url);

      const patternResult = pattern.exec(reqUrl.href);

      const base = patternResult!.inputs[0].toString();

      const path = patternResult!.pathname.groups[0] || '';

      ctx.Runtime.URLMatch = {
        Base: base.substring(0, base.length - path.length),
        Hash: reqUrl.hash,
        Path: path,
        Search: reqUrl.search,
      };

      return this.executePipeline(
        ctx.Runtime.ApplicationProcessorConfig.Handlers,
        req,
        ctx,
      );
    };
  }

  protected executePipeline(
    pipeline: EaCRuntimeHandler[],
    request: Request,
    ctx: EaCRuntimeContext,
    index = -1,
  ): Response | Promise<Response> {
    ctx.Next = async (req) => {
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

    return ctx.Next(request);
  }
}

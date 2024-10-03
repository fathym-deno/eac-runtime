import {
  EaCApplicationAsCode,
  EaCModifierAsCode,
  EaCModifierResolverConfiguration,
  EaCProjectAsCode,
  ESBuild,
  EverythingAsCode,
  getPackageLogger,
  IoCContainer,
  isEverythingAsCodeApplications,
  LoggingProvider,
  merge,
  processCacheControlHeaders,
} from '../src.deps.ts';
import { EAC_RUNTIME_DEV, IS_BUILDING, IS_DENO_DEPLOY } from '../constants.ts';
import { EaCRuntimeConfig } from './config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginDef } from './config/EaCRuntimePluginDef.ts';
import { ProcessorHandlerResolver } from './processors/ProcessorHandlerResolver.ts';
import { ModifierHandlerResolver } from './modifiers/ModifierHandlerResolver.ts';
import { EaCApplicationProcessorConfig } from './processors/EaCApplicationProcessorConfig.ts';
import { EaCProjectProcessorConfig } from './processors/EaCProjectProcessorConfig.ts';
import { EaCRuntime } from './EaCRuntime.ts';
import { EaCRuntimeContext } from './EaCRuntimeContext.ts';
import { EaCRuntimeEaC } from './EaCRuntimeEaC.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';
import { EaCRuntimePlugin } from './plugins/EaCRuntimePlugin.ts';
import { EaCRuntimePluginConfig } from './config/EaCRuntimePluginConfig.ts';
import { EaCRuntimeHandlerPipeline } from './EaCRuntimeHandlerPipeline.ts';
import { buildURLMatch } from './buildURLMatch.ts';

export class DefaultEaCRuntime<TEaC = EaCRuntimeEaC> implements EaCRuntime<TEaC> {
  protected applicationGraph?: Record<string, EaCApplicationProcessorConfig[]>;

  protected pluginConfigs: Map<
    EaCRuntimePlugin<TEaC> | [string, ...args: unknown[]],
    EaCRuntimePluginConfig<TEaC> | undefined
  >;

  protected pluginDefs: Map<
    EaCRuntimePlugin<TEaC> | [string, ...args: unknown[]],
    EaCRuntimePlugin<TEaC>
  >;

  protected projectGraph?: EaCProjectProcessorConfig[];

  public IoC: IoCContainer;

  public EaC?: TEaC;

  public ModifierResolvers?: Record<string, EaCModifierResolverConfiguration>;

  public Revision: number;

  constructor(protected config: EaCRuntimeConfig<TEaC>) {
    this.pluginConfigs = new Map();

    this.pluginDefs = new Map();

    this.IoC = new IoCContainer();

    this.Revision = Date.now();

    if (IS_BUILDING) {
      Deno.env.set('SUPPORTS_WORKERS', 'false');
    }
  }

  public async Configure(options?: {
    configure?: (rt: EaCRuntime<TEaC>) => Promise<void>;
  }): Promise<void> {
    const logger = this.config.LoggingProvider?.Package ??
      (await getPackageLogger(import.meta));

    this.pluginConfigs = new Map();

    this.pluginDefs = new Map();

    this.EaC = this.config.EaC;

    this.IoC = this.config.IoC || new IoCContainer();

    if (this.config.LoggingProvider) {
      this.IoC!.Register(LoggingProvider, () => this.config.LoggingProvider);
    }

    this.ModifierResolvers = this.config.ModifierResolvers || {};

    let esbuild: ESBuild | undefined;

    try {
      esbuild = await this.IoC.Resolve<ESBuild>(this.IoC!.Symbol('ESBuild'));
    } catch {
      esbuild = undefined;
    }

    if (!esbuild) {
      if (IS_DENO_DEPLOY()) {
        esbuild = await import('npm:esbuild-wasm@0.23.1');

        logger.debug('Initialized esbuild with portable WASM.');
      } else {
        esbuild = await import('npm:esbuild@0.23.1');

        logger.debug('Initialized esbuild with standard build.');
      }

      try {
        const worker = IS_DENO_DEPLOY() ? false : undefined;

        await esbuild!.initialize({
          worker,
        });
      } catch (err) {
        logger.error('There was an issue initializing esbuild', err);

        // throw err;
      }

      this.IoC.Register<ESBuild>(() => esbuild!, {
        Type: this.IoC!.Symbol('ESBuild'),
      });
    }

    await this.configurePlugins(this.config.Plugins);

    if (!this.EaC) {
      throw new Error(
        'An EaC must be provided in the config or via a connection to an EaC Service with the EAC_API_KEY environment variable.',
      );
    }

    if (isEverythingAsCodeApplications(this.EaC) && !this.EaC.Projects) {
      throw new Error(
        'The EaC must provide a set of projects to use in the runtime.',
      );
    }

    this.Revision = Date.now();

    await this.finalizePlugins();

    if (options?.configure) {
      options.configure(this);
    }

    this.buildProjectGraph();

    await this.buildApplicationGraph();

    esbuild!.stop();
  }

  public async Handle(
    request: Request,
    info: Deno.ServeHandlerInfo,
  ): Promise<Response> {
    const projProcessorConfig = this.projectGraph!.find((node) => {
      return node.Patterns.some((pattern) => pattern.test(request.url));
    });

    if (!projProcessorConfig) {
      throw new Error(`No project is configured for '${request.url}'.`);
    }

    const resp = projProcessorConfig.Handler(request, {
      Data: {},
      Runtime: {
        Config: this.config,
        EaC: this.EaC,
        Info: info,
        IoC: this.IoC,
        Logs: await this.IoC.Resolve<LoggingProvider>(LoggingProvider),
        ProjectProcessorConfig: projProcessorConfig,
        Revision: this.Revision,
      },
      State: {},
    } as unknown as EaCRuntimeContext);

    return await resp;
  }

  protected async buildApplicationGraph(): Promise<void> {
    if (isEverythingAsCodeApplications(this.EaC) && this.EaC!.Applications) {
      this.applicationGraph = {} as Record<
        string,
        EaCApplicationProcessorConfig[]
      >;

      const projProcCfgCalls = this.projectGraph!.map(async (projProcCfg) => {
        const appLookups = Object.keys(
          projProcCfg.Project.ApplicationResolvers || {},
        );

        this.applicationGraph![projProcCfg.ProjectLookup] = appLookups
          .map((appLookup) => {
            if (!isEverythingAsCodeApplications(this.EaC)) {
              // This will never happen, check is just to get proper typing
              throw new Error();
            }

            const app = this.EaC!.Applications![appLookup];

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
              Revision: this.Revision,
            } as EaCApplicationProcessorConfig;
          })
          .sort((a, b) => {
            return b.ResolverConfig.Priority - a.ResolverConfig.Priority;
          });

        const appProcCfgCalls = this.applicationGraph![
          projProcCfg.ProjectLookup
        ].map(async (appProcCfg) => {
          if (!isEverythingAsCodeApplications(this.EaC)) {
            // This will never happen, check is just to get proper typing
            throw new Error();
          }

          const pipeline = await this.constructPipeline(
            projProcCfg.Project,
            appProcCfg.Application,
            this.EaC!.Modifiers || {},
          );

          pipeline.Append(await this.establishApplicationHandler(appProcCfg));

          appProcCfg.Handlers = pipeline;
        });

        await Promise.all(appProcCfgCalls);
      });

      await Promise.all(projProcCfgCalls);
    }
  }

  protected buildProjectGraph(): void {
    if (isEverythingAsCodeApplications(this.EaC) && this.EaC!.Projects) {
      const projLookups = Object.keys(this.EaC?.Projects || {});

      this.projectGraph = projLookups
        .map((projLookup) => {
          if (!isEverythingAsCodeApplications(this.EaC)) {
            // This will never happen, check is just to get proper typing
            throw new Error();
          }

          const proj = this.EaC!.Projects![projLookup]!;

          const resolverKeys = Object.keys(proj.ResolverConfigs);

          return {
            Project: proj,
            ProjectLookup: projLookup,
            Patterns: resolverKeys.map((lk) => {
              const resolverCfg = proj.ResolverConfigs[lk];

              return new URLPattern({
                hostname: resolverCfg.Hostname,
                port: resolverCfg.Port?.toString(),
                pathname: resolverCfg.Path,
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
    plugins?: EaCRuntimePluginDef<TEaC>[],
  ): Promise<void> {
    for (let pluginDef of plugins || []) {
      const pluginKey = pluginDef as EaCRuntimePluginDef<TEaC>;

      if (Array.isArray(pluginDef)) {
        const [plugin, ...args] = pluginDef as [string, ...args: unknown[]];

        pluginDef = new (await import(plugin)).default(
          args,
        ) as EaCRuntimePlugin<TEaC>;
      }

      this.pluginDefs.set(pluginKey, pluginDef);

      const pluginConfig = this.pluginConfigs.has(pluginKey)
        ? this.pluginConfigs.get(pluginKey)
        : await pluginDef.Setup(this.config);

      this.pluginConfigs.set(pluginKey, pluginConfig);

      if (pluginConfig) {
        if (pluginConfig.EaC) {
          console.log(`--------------------------EntLookup Before--------------------`);
          console.log((this.EaC as EverythingAsCode).EnterpriseLookup || '');
          this.EaC = merge(this.EaC || {}, pluginConfig.EaC);
          console.log(
            `--------------------------EntLookup Plugin ${pluginKey}--------------------`,
          );
          console.log((pluginConfig.EaC as EverythingAsCode).EnterpriseLookup || '');
          console.log(`--------------------------EntLookup After--------------------`);
          console.log((this.EaC as EverythingAsCode).EnterpriseLookup || '');
        }

        if (pluginConfig.IoC) {
          pluginConfig.IoC.CopyTo(this.IoC!);
        }

        if (pluginConfig.ModifierResolvers) {
          this.ModifierResolvers = merge(
            this.ModifierResolvers || {},
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
    modifiers: Record<string, EaCModifierAsCode | null>,
  ): Promise<EaCRuntimeHandlerPipeline> {
    let pipelineModifierResolvers: Record<
      string,
      EaCModifierResolverConfiguration
    > = {};

    pipelineModifierResolvers = merge(
      pipelineModifierResolvers,
      this.ModifierResolvers || {},
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
          pipelineModifiers.push(modifiers[ml.Lookup]!);
        }
      });

    const pipeline = new EaCRuntimeHandlerPipeline();

    const defaultModifierMiddlewareResolver = await this.IoC.Resolve<ModifierHandlerResolver>(
      this.IoC.Symbol('ModifierHandlerResolver'),
    );

    for (const mod of pipelineModifiers) {
      pipeline.Append(
        await defaultModifierMiddlewareResolver.Resolve(this.IoC, mod),
      );
    }

    return pipeline;
  }

  protected async establishApplicationHandler(
    appProcessorConfig: EaCApplicationProcessorConfig,
  ): Promise<EaCRuntimeHandler> {
    const defaultProcessorHandlerResolver = await this.IoC.Resolve<ProcessorHandlerResolver>(
      this.IoC.Symbol('ProcessorHandlerResolver'),
    );

    let handler = await defaultProcessorHandlerResolver.Resolve(
      this.IoC,
      appProcessorConfig,
      this.EaC!,
    );

    if (
      handler &&
      appProcessorConfig.Application.Processor.CacheControl &&
      !EAC_RUNTIME_DEV()
    ) {
      const cacheHandler = handler;

      handler = async (req, ctx) => {
        let resp = await cacheHandler(req, ctx);

        resp = processCacheControlHeaders(
          resp,
          appProcessorConfig.Application.Processor.CacheControl,
          appProcessorConfig.Application.Processor.ForceCache,
        );

        return resp;
      };
    }

    return handler!;
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

      ctx.Runtime.URLMatch = buildURLMatch(
        new URLPattern({
          pathname: ctx.Runtime.ApplicationProcessorConfig.ResolverConfig.PathPattern,
        }),
        req,
      );

      return ctx.Runtime.ApplicationProcessorConfig.Handlers.Execute(req, ctx);
    };
  }

  protected async finalizePlugins(): Promise<void> {
    const buildCalls = Array.from(this.pluginDefs.values()).map(
      async (pluginDef) => {
        const pluginCfg = this.pluginConfigs.get(pluginDef);

        await pluginDef.Build?.(this.EaC!, this.IoC, pluginCfg);
      },
    );

    await Promise.all(buildCalls);

    for (const pluginDef of this.pluginDefs.values() || []) {
      await pluginDef.AfterEaCResolved?.(this.EaC!, this.IoC);
    }
  }
}

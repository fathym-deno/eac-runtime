import {
  AzureAISearchVectorStore,
  AzureChatOpenAI,
  AzureOpenAIEmbeddings,
  BaseLanguageModel,
  EaCApplicationAsCode,
  EaCAzureOpenAIEmbeddingsDetails,
  EaCAzureOpenAILLMDetails,
  EaCAzureSearchAIVectorStoreDetails,
  EaCDenoKVDatabaseDetails,
  EaCModifierAsCode,
  EaCProjectAsCode,
  EaCWatsonXLLMDetails,
  Embeddings,
  initializeDenoKv,
  IoCContainer,
  isEaCAzureOpenAIEmbeddingsDetails,
  isEaCAzureOpenAILLMDetails,
  isEaCAzureSearchAIVectorStoreDetails,
  isEaCDenoKVDatabaseDetails,
  isEaCWatsonXLLMDetails,
  mergeWithArrays,
  VectorStore,
  WatsonxAI,
} from '../src.deps.ts';
import { EaCRuntimeConfig } from './config/EaCRuntimeConfig.ts';
import { defaultAppHandlerResolver } from './processors/defaultAppHandlerResolver.tsx';
import { defaultModifierMiddlewareResolver } from './processors/defaultModifierMiddlewareResolver.ts';
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

  protected modifierLookups?: string[];

  protected projectGraph?: EaCProjectProcessorConfig[];

  protected revision: number;

  constructor(protected config: EaCRuntimeConfig) {
    this.ioc = new IoCContainer();

    this.revision = Date.now();
  }

  public async Configure(): Promise<void> {
    this.eac = this.config.EaC;

    this.ioc = this.config.IoC || new IoCContainer();

    this.modifierLookups = this.config.ModifierLookups || [];

    await this.processPlugins(this.config.Plugins);

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

    this.configureEaCServices();

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
      Config: this.config,
      EaC: this.eac,
      Info: info,
      IoC: this.ioc,
      ProjectProcessorConfig: projProcessorConfig,
      Revision: this.revision,
    } as EaCRuntimeContext);

    return resp;
  }

  protected async buildApplicationGraph(): Promise<void> {
    if (this.eac!.Applications) {
      this.applicationGraph = {} as Record<
        string,
        EaCApplicationProcessorConfig[]
      >;

      for (const projProcCfg of this.projectGraph!) {
        const appLookups = Object.keys(
          projProcCfg.Project.ApplicationLookups || {},
        );

        this.applicationGraph[projProcCfg.ProjectLookup] = appLookups
          .map((appLookup) => {
            const app = this.eac!.Applications![appLookup];

            if (!app) {
              throw new Error(
                `The '${appLookup}' app configured for the project does not exist in the EaC Applications configuration.`,
              );
            }

            const lookupCfg = projProcCfg.Project.ApplicationLookups[appLookup];

            return {
              Application: app,
              ApplicationLookup: appLookup,
              LookupConfig: lookupCfg,
              Pattern: new URLPattern({ pathname: lookupCfg.PathPattern }),
            } as EaCApplicationProcessorConfig;
          })
          .sort((a, b) => {
            return b.LookupConfig.Priority - a.LookupConfig.Priority;
          });

        for (
          const appProcCfg of this.applicationGraph[
            projProcCfg.ProjectLookup
          ]
        ) {
          const pipeline: EaCRuntimeHandler[] = this.constructPipeline(
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

  protected configureEaCAI(): void {
    const aiLookups = Object.keys(this.eac!.AIs || {});

    aiLookups.forEach((aiLookup) => {
      const ai = this.eac!.AIs![aiLookup];

      const llmLookups = Object.keys(ai.LLMs || {});

      llmLookups.forEach((llmLookup) => {
        const llm = ai.LLMs![llmLookup];

        if (isEaCAzureOpenAILLMDetails(llm.Details)) {
          const llmDetails = llm.Details as EaCAzureOpenAILLMDetails;

          this.ioc.Register(
            AzureChatOpenAI,
            () =>
              new AzureChatOpenAI({
                azureOpenAIEndpoint: llmDetails.Endpoint,
                azureOpenAIApiKey: llmDetails.APIKey,
                azureOpenAIEmbeddingsApiDeploymentName: llmDetails.DeploymentName,
                modelName: llmDetails.ModelName,
                temperature: 0.7,
                // maxTokens: 1000,
                maxRetries: 5,
                verbose: llmDetails.Verbose,
                streaming: llmDetails.Streaming,
                ...(llmDetails.InputParams || {}),
              }),
            {
              Lazy: true,
              Name: `${aiLookup}|${llmLookup}`,
              Type: this.ioc.Symbol(BaseLanguageModel.name),
            },
          );
        } else if (isEaCWatsonXLLMDetails(llm.Details)) {
          const llmDetails = llm.Details as EaCWatsonXLLMDetails;

          this.ioc.Register(
            WatsonxAI,
            () =>
              new WatsonxAI({
                ibmCloudApiKey: llmDetails.APIKey,
                projectId: llmDetails.ProjectID,
                modelId: llmDetails.ModelID,
                modelParameters: llmDetails.ModelParameters ?? {},
                verbose: llmDetails.Verbose,
              }),
            {
              Lazy: true,
              Name: `${aiLookup}|${llmLookup}`,
              Type: this.ioc.Symbol(BaseLanguageModel.name),
            },
          );
        }
      });

      const embeddingsLookups = Object.keys(ai.Embeddings || {});

      embeddingsLookups.forEach((embeddingsLookup) => {
        const embeddings = ai.Embeddings![embeddingsLookup];

        if (isEaCAzureOpenAIEmbeddingsDetails(embeddings.Details)) {
          const embeddingsDetails = embeddings.Details as EaCAzureOpenAIEmbeddingsDetails;

          this.ioc.Register(
            AzureOpenAIEmbeddings,
            () =>
              new AzureOpenAIEmbeddings({
                azureOpenAIEndpoint: embeddingsDetails.Endpoint,
                azureOpenAIApiKey: embeddingsDetails.APIKey,
                azureOpenAIEmbeddingsApiDeploymentName: embeddingsDetails.DeploymentName,
              }),
            {
              Lazy: true,
              Name: `${aiLookup}|${embeddingsLookup}`,
              Type: this.ioc.Symbol(Embeddings.name),
            },
          );
        }
      });

      const vectorStoreLookups = Object.keys(ai.VectorStores || {});

      vectorStoreLookups.forEach((vectorStoreLookup) => {
        const vectorStore = ai.VectorStores![vectorStoreLookup];

        if (isEaCAzureSearchAIVectorStoreDetails(vectorStore.Details)) {
          const vectorStoreDetails = vectorStore.Details as EaCAzureSearchAIVectorStoreDetails;

          this.ioc.Register(
            AzureAISearchVectorStore,
            async (ioc) =>
              new AzureAISearchVectorStore(
                await ioc.Resolve<Embeddings>(
                  ioc.Symbol(Embeddings.name),
                  `${aiLookup}|${vectorStoreDetails.EmbeddingsLookup}`,
                ),
                {
                  endpoint: vectorStoreDetails.Endpoint,
                  key: vectorStoreDetails.APIKey,
                  search: {
                    type: vectorStoreDetails.QueryType,
                  },
                },
              ),
            {
              Lazy: true,
              Name: `${aiLookup}|${vectorStoreLookup}`,
              Type: this.ioc.Symbol(VectorStore.name),
            },
          );
        }
      });
    });
  }

  protected configureEaCDatabases(): void {
    const dbLookups = Object.keys(this.eac!.Databases || {});

    dbLookups.forEach((dbLookup) => {
      const db = this.eac!.Databases![dbLookup];

      if (isEaCDenoKVDatabaseDetails(db.Details)) {
        const dbDetails = db.Details as EaCDenoKVDatabaseDetails;

        this.ioc.Register(
          Deno.Kv,
          () => initializeDenoKv(dbDetails.DenoKVPath),
          {
            Lazy: true,
            Name: dbLookup,
          },
        );
      }
    });
  }

  protected configureEaCServices(): void {
    this.configureEaCAI();

    this.configureEaCDatabases();
  }

  protected constructPipeline(
    project: EaCProjectAsCode,
    application: EaCApplicationAsCode,
    modifiers: Record<string, EaCModifierAsCode>,
  ): EaCRuntimeHandler[] {
    const pipelineModifierLookups: string[] = [];

    pipelineModifierLookups.push(...(this.modifierLookups || []));

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

  protected async establishApplicationHandler(
    appProcessorConfig: EaCApplicationProcessorConfig,
  ): Promise<EaCRuntimeHandler> {
    return await defaultAppHandlerResolver.Resolve(this.ioc, appProcessorConfig);
  }

  protected establishProjectHandler(
    projProcessorConfig: EaCProjectProcessorConfig,
  ): EaCRuntimeHandler {
    return (req, ctx) => {
      const appProcessorConfig = this.applicationGraph![
        projProcessorConfig.ProjectLookup
      ].find((node) => {
        const appLookupConfig = projProcessorConfig.Project.ApplicationLookups[
          node.ApplicationLookup
        ];

        const isAllowedMethod = !appLookupConfig.AllowedMethods ||
          appLookupConfig.AllowedMethods.length === 0 ||
          appLookupConfig.AllowedMethods.some(
            (am) => am.toLowerCase() === req.method.toLowerCase(),
          );

        const matchesRegex = !appLookupConfig.UserAgentRegex ||
          new RegExp(appLookupConfig.UserAgentRegex).test(
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

      ctx.ApplicationProcessorConfig = appProcessorConfig;

      return this.executePipeline(
        ctx.ApplicationProcessorConfig.Handlers,
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

  protected async processPlugins(
    plugins?: (EaCRuntimePlugin | [string, ...args: unknown[]])[],
  ): Promise<void> {
    for (let pluginDef of plugins || []) {
      if (Array.isArray(pluginDef)) {
        const [plugin, ...args] = pluginDef;

        pluginDef = new (await import(plugin)).default(
          args,
        ) as EaCRuntimePlugin;
      }

      const pluginConfig = await pluginDef.Build();

      if (pluginConfig) {
        if (pluginConfig.EaC) {
          this.eac = mergeWithArrays(this.eac || {}, pluginConfig.EaC);
        }

        if (pluginConfig.IoC) {
          pluginConfig.IoC.CopyTo(this.ioc!);
        }

        if (pluginConfig.ModifierLookups) {
          this.modifierLookups!.push(...(pluginConfig.ModifierLookups || []));

          this.modifierLookups = [...new Set(this.modifierLookups)];
        }

        await this.processPlugins(pluginConfig.Plugins);
      }
    }
  }
}

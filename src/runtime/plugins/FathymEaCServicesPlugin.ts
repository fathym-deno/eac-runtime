import {
  AzureAISearchVectorStore,
  AzureChatOpenAI,
  AzureOpenAIEmbeddings,
  BaseLanguageModel,
  EaCAzureOpenAIEmbeddingsDetails,
  EaCAzureOpenAILLMDetails,
  EaCAzureSearchAIVectorStoreDetails,
  EaCDenoKVDatabaseDetails,
  EaCWatsonXLLMDetails,
  Embeddings,
  initializeDenoKv,
  IoCContainer,
  isEaCAzureOpenAIEmbeddingsDetails,
  isEaCAzureOpenAILLMDetails,
  isEaCAzureSearchAIVectorStoreDetails,
  isEaCDenoKVDatabaseDetails,
  isEaCWatsonXLLMDetails,
  VectorStore,
  WatsonxAI,
} from '../../src.deps.ts';
import { EaCRuntimeEaC } from '../../runtime/EaCRuntimeEaC.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';

export default class FathymEaCServicesPlugin implements EaCRuntimePlugin {
  public AfterEaCResolved(
    eac: EaCRuntimeEaC,
    ioc: IoCContainer,
  ): Promise<void> {
    return Promise.resolve(this.configureEaCServices(eac, ioc));
  }

  public Setup(
    _config: EaCRuntimeConfig,
  ): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymEaCServicesPlugin',
    };

    return Promise.resolve(pluginConfig);
  }

  protected configureEaCAI(eac: EaCRuntimeEaC, ioc: IoCContainer): void {
    const aiLookups = Object.keys(eac!.AIs || {});

    aiLookups.forEach((aiLookup) => {
      const ai = eac!.AIs![aiLookup];

      const llmLookups = Object.keys(ai.LLMs || {});

      llmLookups.forEach((llmLookup) => {
        const llm = ai.LLMs![llmLookup];

        if (isEaCAzureOpenAILLMDetails(llm.Details)) {
          const llmDetails = llm.Details as EaCAzureOpenAILLMDetails;

          ioc.Register(
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
              Type: ioc.Symbol(BaseLanguageModel.name),
            },
          );
        } else if (isEaCWatsonXLLMDetails(llm.Details)) {
          const llmDetails = llm.Details as EaCWatsonXLLMDetails;

          ioc.Register(
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
              Type: ioc.Symbol(BaseLanguageModel.name),
            },
          );
        }
      });

      const embeddingsLookups = Object.keys(ai.Embeddings || {});

      embeddingsLookups.forEach((embeddingsLookup) => {
        const embeddings = ai.Embeddings![embeddingsLookup];

        if (isEaCAzureOpenAIEmbeddingsDetails(embeddings.Details)) {
          const embeddingsDetails = embeddings.Details as EaCAzureOpenAIEmbeddingsDetails;

          ioc.Register(
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
              Type: ioc.Symbol(Embeddings.name),
            },
          );
        }
      });

      const vectorStoreLookups = Object.keys(ai.VectorStores || {});

      vectorStoreLookups.forEach((vectorStoreLookup) => {
        const vectorStore = ai.VectorStores![vectorStoreLookup];

        if (isEaCAzureSearchAIVectorStoreDetails(vectorStore.Details)) {
          const vectorStoreDetails = vectorStore.Details as EaCAzureSearchAIVectorStoreDetails;

          ioc.Register(
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
              Type: ioc.Symbol(VectorStore.name),
            },
          );
        }
      });
    });
  }

  protected configureEaCDatabases(eac: EaCRuntimeEaC, ioc: IoCContainer): void {
    const dbLookups = Object.keys(eac!.Databases || {});

    dbLookups.forEach((dbLookup) => {
      const db = eac!.Databases![dbLookup];

      if (isEaCDenoKVDatabaseDetails(db.Details)) {
        const dbDetails = db.Details as EaCDenoKVDatabaseDetails;

        ioc.Register(Deno.Kv, () => initializeDenoKv(dbDetails.DenoKVPath), {
          Lazy: true,
          Name: dbLookup,
        });
      }
    });
  }

  protected configureEaCServices(eac: EaCRuntimeEaC, ioc: IoCContainer): void {
    this.configureEaCAI(eac, ioc);

    this.configureEaCDatabases(eac, ioc);
  }
}

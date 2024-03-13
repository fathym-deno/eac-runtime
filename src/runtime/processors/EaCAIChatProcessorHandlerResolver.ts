import {
  aiChatRequest,
  BaseLanguageModel,
  EaCAIChatProcessor,
  isEaCAIChatProcessor,
  VectorStore,
} from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';

export const EaCAIChatProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg) {
    if (!isEaCAIChatProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCAIChatProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCAIChatProcessor;

    const llm = await ioc.Resolve<BaseLanguageModel>(
      ioc.Symbol(BaseLanguageModel.name),
      `${processor.AILookup}|${processor.LLMLookup}`,
    );

    const vectorStore = processor.VectorStoreLookup
      ? await ioc.Resolve<VectorStore>(
        ioc.Symbol(VectorStore.name),
        `${processor.AILookup}|${processor.VectorStoreLookup}`,
      )
      : undefined;

    return (req, _ctx) => {
      return aiChatRequest(
        req,
        llm,
        processor.Messages,
        processor.UseSSEFormat,
        processor.DefaultInput,
        vectorStore,
        processor.DefaultRAGInput,
      );
    };
  },
};

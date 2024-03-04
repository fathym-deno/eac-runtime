import {
  aiChatRequest,
  BaseLanguageModel,
  EaCAIChatProcessor,
  isEaCAIChatProcessor,
  VectorStore,
} from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';

export const EaCAIChatProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, appProcCfg) {
    if (!isEaCAIChatProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCAIChatProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCAIChatProcessor;

    return Promise.resolve(async (req, ctx) => {
      const llm = await ctx.Runtime.IoC.Resolve<BaseLanguageModel>(
        ctx.Runtime.IoC.Symbol(BaseLanguageModel.name),
        `${processor.AILookup}|${processor.LLMLookup}`,
      );

      const vectorStore = processor.VectorStoreLookup
        ? await ctx.Runtime.IoC.Resolve<VectorStore>(
          ctx.Runtime.IoC.Symbol(VectorStore.name),
          `${processor.AILookup}|${processor.VectorStoreLookup}`,
        )
        : undefined;

      return aiChatRequest(
        req,
        llm,
        processor.Messages,
        processor.UseSSEFormat,
        processor.DefaultInput,
        vectorStore,
        processor.DefaultRAGInput,
      );
    });
  },
};

import {
  aiChatRequest,
  BaseLanguageModel,
  EaCAIChatProcessor,
  isEaCAIChatProcessor,
  VectorStore,
} from '../../src.deps.ts';
import { AppHandlerResolver } from './AppHandlerResolver.ts';

export const EaCAIChatProcessorAppHandlerResolver: AppHandlerResolver = {
  Resolve(_ioc, appProcCfg) {
    if (!isEaCAIChatProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCAIChatProcessorAppHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCAIChatProcessor;

    return Promise.resolve(async (req, ctx) => {
      const llm = await ctx.IoC.Resolve<BaseLanguageModel>(
        ctx.IoC.Symbol(BaseLanguageModel.name),
        `${processor.AILookup}|${processor.LLMLookup}`,
      );

      const vectorStore = processor.VectorStoreLookup
        ? await ctx.IoC.Resolve<VectorStore>(
          ctx.IoC.Symbol(VectorStore.name),
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

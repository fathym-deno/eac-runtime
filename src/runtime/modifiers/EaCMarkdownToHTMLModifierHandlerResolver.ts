import {
  EaCMarkdownToHTMLModifierDetails,
  isEaCMarkdownToHTMLModifierDetails,
} from '../../src.deps.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';
import { establishMarkdownToHTMLMiddleware } from '../../modules/markdown/markdownToHtmlMiddleware.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export const EaCMarkdownToHTMLModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCMarkdownToHTMLModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCMarkdownModifierHandlerResolver.',
      );
    }

    const _details = modifier.Details as EaCMarkdownToHTMLModifierDetails;

    return Promise.resolve(establishMarkdownToHTMLMiddleware());
  },
};

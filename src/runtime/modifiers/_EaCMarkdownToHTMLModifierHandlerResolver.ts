import {
  EaCMarkdownToHTMLModifierDetails,
  isEaCMarkdownToHTMLModifierDetails,
} from '../../src.deps.js';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.js';
import { establishMarkdownToHTMLMiddleware } from '../../modules/markdown/markdownToHtmlMiddleware.js';

export const EaCMarkdownToHTMLModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier) {
    if (!isEaCMarkdownToHTMLModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCMarkdownModifierHandlerResolver.',
      );
    }

    const _details = modifier.Details as EaCMarkdownToHTMLModifierDetails;

    return Promise.resolve(
      establishMarkdownToHTMLMiddleware(),
    );
  },
};

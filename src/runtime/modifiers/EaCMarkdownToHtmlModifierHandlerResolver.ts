import {
  EaCMarkdownToHtmlModifierDetails,
  isEaCMarkdownToHtmlModifierDetails,
} from '../../src.deps.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';
import { establishMarkdownToHtmlMiddleware } from '../../modules/markdown/markdownToHtmlMiddleware.ts';

export const EaCMarkdownToHtmlModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier) {
    if (!isEaCMarkdownToHtmlModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCMarkdownModifierHandlerResolver.',
      );
    }

    const _details = modifier.Details as EaCMarkdownToHtmlModifierDetails;

    return Promise.resolve(
      establishMarkdownToHtmlMiddleware(),
    );
  },
};

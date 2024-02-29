import { EaCMarkdownModifierDetails, isEaCMarkdownModifierDetails } from '../../src.deps.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';
import { establishMarkdownMiddleware } from '../../modules/markdown/markdownMiddleware.ts';

export const EaCMarkdownModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier) {
    if (!isEaCMarkdownModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCMarkdownModifierHandlerResolver.',
      );
    }

    const _details = modifier.Details as EaCMarkdownModifierDetails;

    return Promise.resolve(
      establishMarkdownMiddleware(),
    );
  },
};

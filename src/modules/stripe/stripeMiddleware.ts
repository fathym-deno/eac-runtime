import { DOMParser, Element, initParser } from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';

export function establishStripeMiddleware(
  includeScript: boolean,
): EaCRuntimeHandler {
  const initCheck = new Promise<boolean>((resolve) => {
    initParser().then(() => resolve(true));
  });

  initCheck.then();

  return async (_req, ctx) => {
    if (includeScript) {
      let resp = await ctx.Next();

      if (resp) {
        const contType = resp.headers.get('Content-type');

        if (
          contType?.includes('text/html') ||
          contType?.includes('text/plain')
        ) {
          await initCheck;

          const htmlStr = await resp.clone().text();

          if (htmlStr.startsWith('<')) {
            const doc = new DOMParser().parseFromString(htmlStr, 'text/html');

            if (doc) {
              const scriptNode = doc.createElement('script');

              scriptNode.setAttribute('src', 'https://js.stripe.com/v3');

              scriptNode.setAttribute('async', true);

              doc.head.appendChild(scriptNode);

              const docHtml = doc.childNodes[1] as Element;

              const fullDoc = `<!DOCTYPE html>\n${docHtml.outerHTML}`;

              resp = new Response(fullDoc, resp);
            }
          }
        }
      }

      return resp;
    }

    return ctx.Next();
  };
}

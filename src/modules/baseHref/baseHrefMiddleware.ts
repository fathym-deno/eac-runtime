import { DOMParser, Element, getPackageLoggerSync, initParser } from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';

export function establishBaseHrefMiddleware(): EaCRuntimeHandler {
  const logger = getPackageLoggerSync(import.meta);

  const initCheck = new Promise<boolean>((resolve) => {
    logger.debug('Configuring keep alive...');

    initParser().then(() => resolve(true));
  });

  initCheck.then();

  return async (_req, ctx) => {
    let resp = await ctx.Next();

    const contType = resp.headers.get('Content-type');

    if (contType?.includes('text/html')) {
      await initCheck;

      let baseHref = ctx.Runtime.URLMatch.Base;

      if (!baseHref.endsWith('/')) {
        baseHref += '/';
      }

      const htmlStr = await resp.clone().text();

      const doc = new DOMParser().parseFromString(htmlStr, 'text/html');

      if (doc) {
        const baseScriptNode = doc.head.querySelector('base') ?? doc.createElement('base');
        baseScriptNode.setAttribute('href', baseHref);

        if (!doc.head.querySelector('base')) {
          doc.head.prepend(baseScriptNode);
        }

        const docHtml = doc.childNodes[1] as Element;

        const fullDoc = `<!DOCTYPE html>\n${docHtml.outerHTML}`;

        resp = new Response(fullDoc, resp);
      }
    }

    return resp;
  };
}

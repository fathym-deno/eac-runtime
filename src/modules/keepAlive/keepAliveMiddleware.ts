import { DOMParser, Element, initParser, transpile } from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';
import { EAC_RUNTIME_DEV } from '../../constants.ts';

export function establishKeepAliveMiddleware(
  keepAlivePath: string,
): EaCRuntimeHandler {
  const initCheck = new Promise<boolean>((resolve) => {
    if (EAC_RUNTIME_DEV()) {
      console.log('Configuring keep alive...');

      initParser().then(() => resolve(true));
    } else {
      resolve(true);
    }
  });

  initCheck.then();

  return async (req, ctx) => {
    if (EAC_RUNTIME_DEV()) {
      await initCheck;

      const keepAliveCheckPattern = new URLPattern({
        pathname: `*${keepAlivePath}`,
      });

      const keepAliveClientPath = `${keepAlivePath}/keepAliveClient.ts`;

      const keepAliveCheckClientPattern = new URLPattern({
        pathname: `*${keepAliveClientPath}`,
      });

      if (
        keepAliveCheckPattern.test(req.url) &&
        req.headers.get('upgrade') === 'websocket'
      ) {
        const { response, socket } = Deno.upgradeWebSocket(req);

        socket.addEventListener('open', () => {
          socket.send(
            JSON.stringify({
              revision: ctx.Runtime.Revision,
              type: 'keep-alive',
            }),
          );
        });

        return response;
      } else if (keepAliveCheckClientPattern.test(req.url)) {
        const clientUrl = new URL('./keepAliveClient.ts', import.meta.url);

        const result = await transpile(clientUrl);

        const code = result.get(clientUrl.href);
        // const keepAliveClientTs = await Deno.open('./src/modules/keepAlive/keepAliveClient.ts', {
        //   read: true,
        // });

        return new Response(code, {
          headers: {
            'cache-control': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
            'Content-Type': 'text/javascript',
          },
        });
      } else {
        let resp = await ctx.Next();

        const contType = resp.headers.get('Content-type');

        // If resp hase `text/html` content type, add keep alive client
        if (contType?.includes('text/html')) {
          const htmlStr = await resp.clone().text();

          const doc = new DOMParser().parseFromString(htmlStr, 'text/html');

          if (doc) {
            const keepAliveClientURL = new URL(
              keepAliveClientPath,
              ctx.Runtime.URLMatch.Base,
            );

            const keepAliveURL = new URL(
              keepAlivePath,
              ctx.Runtime.URLMatch.Base,
            );

            const keepAliveClientScriptNode = doc.createElement('script');
            keepAliveClientScriptNode.setAttribute('type', 'module');
            keepAliveClientScriptNode.innerHTML =
              `import { configureKeepAlive } from '${keepAliveClientURL.href}?${ctx.Runtime.Revision}';

configureKeepAlive('${keepAliveURL.href}');`;
            // keepAliveClientScriptNode.setAttribute('src', keepAliveClientPath);

            doc.head.appendChild(keepAliveClientScriptNode);

            const docHtml = doc.childNodes[1] as Element;

            const fullDoc = `<!DOCTYPE html>\n${docHtml.outerHTML}`;

            resp = new Response(fullDoc, resp);
          }
        }

        return resp;
      }
    } else {
      return ctx.Next();
    }
  };
}

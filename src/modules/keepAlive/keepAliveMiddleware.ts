import { DOMParser, domInitParser, Element, transpile } from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';

export async function establishKeepAliveMiddleware(
  keepAlivePath: string,
  loadRevision: () => string
): Promise<EaCRuntimeHandler> {
  console.log('Configuring keep alive...')
  await domInitParser();

  return async (req, ctx) => {
    const keepAliveCheckPattern = new URLPattern({ pathname: keepAlivePath });

    const keepAliveClientPath = `${keepAlivePath}/keepAliveClient.ts`;

    const keepAliveCheckClientPattern = new URLPattern({ pathname: keepAliveClientPath });

    if (
      keepAliveCheckPattern.test(req.url) &&
      req.headers.get('upgrade') === 'websocket'
    ) {
      const { response, socket } = Deno.upgradeWebSocket(req);

      socket.addEventListener('open', () => {
        socket.send(
          JSON.stringify({
            revision: loadRevision(),
            type: 'keep-alive',
          })
        );
      });

      return response;
    } else if (keepAliveCheckClientPattern.test(req.url)) {
      const clientUrl = new URL("./keepAliveClient.ts", import.meta.url);
      const result = await transpile(clientUrl);

      const code = result.get(clientUrl.href);
      // const keepAliveClientTs = await Deno.open('./src/modules/keepAlive/keepAliveClient.ts', {
      //   read: true,
      // });

      return new Response(code, {
        headers: {
          'Content-Type': 'text/javascript',
        },
      });
    } else {
      let resp = await ctx.next();

      const contType = resp.headers.get('Content-type');

      // If resp hase `text/html` content type, add keep alive client
      if (contType?.includes('text/html')) {
        const htmlStr = await resp.clone().text();

        const doc = new DOMParser().parseFromString(htmlStr, 'text/html');

        if (doc) {
          const keepAliveClientScriptNode = doc.createElement('script');
          keepAliveClientScriptNode.setAttribute('type', 'module');
          keepAliveClientScriptNode.setAttribute('src', keepAliveClientPath);

          doc.head.appendChild(keepAliveClientScriptNode);

          const docHtml = doc.childNodes[1] as Element;

          const fullDoc = `<!DOCTYPE html>\n${docHtml.outerHTML}`

          resp = new Response(fullDoc, resp);
        }
      }

      return resp;
    }
  };
}

function initParser() {
  throw new Error('Function not implemented.');
}

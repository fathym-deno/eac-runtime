import { frontMatter, gfm } from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';

export function establishMarkdownToHtmlMiddleware(): EaCRuntimeHandler {
  return async (_req, ctx) => {
    let resp = await ctx.next();

    if (
      resp.headers.has('Content-Type') &&
      resp.headers.get('Content-Type') === 'text/markdown'
    ) {
      const cloned = resp.clone();

      const markdown = await cloned.text();

      const { body } = markdown.startsWith('---')
        ? frontMatter.extract(markdown)
        : { body: markdown };

      const rendered = gfm.render(body);

      const respBody = `<style>${gfm.CSS}</style>${rendered}`;

      resp = new Response(respBody, {
        headers: resp.headers,
      });

      resp.headers.set('Content-Type', 'text/html');
    }

    return resp;
  };
}

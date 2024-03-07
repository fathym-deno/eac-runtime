// deno-lint-ignore-file no-explicit-any
import {
  DOMParser,
  EaCPreactAppProcessor,
  Element,
  initParser,
  isEaCPreactAppProcessor,
  PreactRenderToString,
  transpile,
} from '../../src.deps.ts';
import { IslandData } from '../apps/islands/IslandData.tsx';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { filesReadyCheck } from '../../utils/dfs/filesReadyCheck.ts';
import { loadRequestPathPatterns } from '../../utils/dfs/loadRequestPathPatterns.ts';
import { loadPreactAppHandler } from '../apps/loadPreactAppHandler.ts';
import { loadIslandClientScript } from '../apps/islands/loadIslandClientScript.ts';
import { executePathMatch } from '../../utils/dfs/executePathMatch.ts';

export const EaCPreactAppProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(ioc, appProcCfg) {
    if (!isEaCPreactAppProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCPreactAppProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

    const patternsReady = filesReadyCheck(ioc, processor.DFS).then(
      (fileHandler) => {
        return loadRequestPathPatterns(
          fileHandler,
          processor.DFS,
          loadPreactAppHandler,
        ).then((patterns) => {
          console.log(patterns); //.map((p) => p.PatternText));

          return { patterns };
        });
      },
    );

    const initCheck = new Promise<boolean>((resolve) => {
      console.log('Configuring keep alive...');

      initParser().then(() => resolve(true));
    });

    initCheck.then();

    const islandsClientPath = `/eacIslandsClient.ts`;

    return Promise.resolve(async (req, ctx) => {
      const { patterns } = await patternsReady;

      await initCheck;

      if (ctx.Runtime.URLMatch.Path.endsWith(islandsClientPath)) {
        const code = await loadIslandClientScript(islandsClientPath);

        return new Response(code, {
          headers: {
            // 'cache-control': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
            'Content-Type': 'text/javascript',
          },
        });
      }

      let resp = await executePathMatch(
        patterns,
        req,
        ctx,
        'text/html; charset=utf-8',
      );

      const contType = resp.headers.get('Content-type');

      if (IslandData.Data && contType?.includes('text/html')) {
        const htmlStr = await resp.clone().text();

        const doc = new DOMParser().parseFromString(htmlStr, 'text/html');

        if (doc) {
          const base = ctx.Runtime.URLMatch.Base.endsWith('/')
            ? ctx.Runtime.URLMatch.Base
            : `${ctx.Runtime.URLMatch.Base}/`;

          let path = ctx.Runtime.URLMatch.Path.startsWith('/')
            ? `.${ctx.Runtime.URLMatch.Path}`
            : ctx.Runtime.URLMatch.Path;

          path = path.endsWith('/') ? path : `${path}/`;

          const clientUrl = new URL(
            `.${islandsClientPath}`,
            new URL(path, base),
          );

          const islandData = PreactRenderToString.renderToString(
            <IslandData clientModulePath={`${clientUrl.href}`} />,
          );

          //           const importMap = doc.createElement('script');
          //           importMap.setAttribute('type', 'importmap');
          //           importMap.innerHTML = `{
          //   "imports": {
          //     "preact": "https://esm.sh/preact@10.19.6"
          //   }
          // }`;

          //           doc.head.appendChild(importMap);

          const template = doc.createElement('template') as any;
          template.innerHTML = islandData;

          doc.body.appendChild(template.content.firstChild);

          const docHtml = doc.childNodes[1] as Element;

          const fullDoc = `<!DOCTYPE html>\n${docHtml.outerHTML}`;

          resp = new Response(fullDoc, resp);
        }
      }

      return resp;
    });
  },
};

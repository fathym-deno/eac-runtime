// deno-lint-ignore-file no-explicit-any
import {
  ComponentType,
  EaCDistributedFileSystem,
  h,
  PreactRenderToString,
  respond,
} from '../../src.deps.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EaCRuntimeHandlerResult } from '../EaCRuntimeHandlerResult.ts';
import { loadPreactAppPageHandler } from './loadPreactAppPageHandler.ts';
import { PageProps } from './PageProps.ts';

export async function loadPreactAppHandler(
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
  layouts: [string, ComponentType<any>][],
): Promise<EaCRuntimeHandlerResult> {
  let [pageHandlers, component] = await loadPreactAppPageHandler(
    fileHandler,
    filePath,
    dfs,
  );

  const pageLayouts = layouts
    .filter(([root]) => {
      return filePath.startsWith(root);
    })
    .map(([_root, layout]) => layout);

  const renderStack: ComponentType<any>[] = [...pageLayouts, component];

  const renderSetupHandler: EaCRuntimeHandler = (_req, ctx) => {
    ctx.Render = async (data) => {
      const pageProps: PageProps = {
        Data: data,
        Params: ctx.Params,
        // URL: new URL(ctx.Runtime.URLMatch.Path, ctx.Runtime.URLMatch.Base),
        Component: () => null,
      };

      // const componentStack = new Array(renderStack.length).fill(null);

      // for (let i = 0; i < renderStack.length; i++) {
      //   componentStack[i] = () => {
      //     return h(renderStack[i], {
      //       ...pageProps,
      //       Component() {
      //         return h(componentStack[i + 1], null);
      //       },
      //     });
      //   };
      // }

      const routeComponent = renderStack[renderStack.length - 1];

      let finalComp = h(routeComponent, pageProps);

      let i = renderStack.length - 1;

      while (i--) {
        const component = renderStack[i];

        const curComp = finalComp;

        finalComp = h(component, {
          ...pageProps,
          Component() {
            return curComp;
          },
        });
      }

      const html = await PreactRenderToString.renderToStringAsync(finalComp);

      return respond(html);
    };

    return ctx.Next();
  };

  if (!Array.isArray(pageHandlers)) {
    console.log(pageHandlers);
    pageHandlers = [pageHandlers];
  }

  return [renderSetupHandler, ...pageHandlers];
}

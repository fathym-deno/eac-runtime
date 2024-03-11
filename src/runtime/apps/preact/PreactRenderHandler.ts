// deno-lint-ignore-file no-explicit-any
import { jsonc, path, PreactRenderToString } from '../../../src.deps.ts';
import {
  ClassAttributes,
  Component,
  // type ComponentChildren,
  ComponentType,
  Fragment,
  h,
  isValidElement,
  type VNode,
} from 'preact';
import { AdvancedPreactOptions } from './AdvancedPreactOptions.ts';
import { DenoConfig } from '../../../utils/DenoConfig.ts';
import { Island } from '../islands/Island.ts';
import { IslandDataStore } from '../islands/IslandDataStore.tsx';
import { PageProps } from '../PageProps.ts';
import { PreactHookTypes } from './PreactHookTypes.ts';
import { EaCRuntimeContext } from '../../EaCRuntimeContext.ts';

export class PreactRenderHandler {
  //#region Fields
  protected clientImports: string[];

  protected denoJson: DenoConfig;

  public islandsData: IslandDataStore;

  protected islandsMap: Map<string, Island>;

  protected origBeforeDiff;

  protected origBeforeRender;

  protected origDiffed;

  protected origHook;

  protected origVNodeHook;

  protected SlotTracker = (
    props: { id: string; children?: ComponentChildren },
  ): VNode => {
    current?.slots.delete(props.id);
    
    // deno-lint-ignore no-explicit-any
    return props.children as any;
  }

  protected tracking: {
    ownerStack: VNode[];

    owners: Map<VNode, VNode>;

    patched: WeakSet<VNode>;

    renderingUserTemplate: boolean;

    template: {
      bodyProps?: Record<string, unknown>;

      hasHeadChildren: boolean;

      headChildNodes: { type: string; props: Record<string, unknown> }[];

      headProps?: Record<string, unknown>;

      htmlProps?: Record<string, unknown>;

      slots: new Map<string, ComponentChildren>();
  
      titleNode?: VNode<any>;

      userTemplate: boolean;
    };
  };
  //#endregion

  constructor(protected options: AdvancedPreactOptions) {
    this.clientImports = [];

    this.islandsData = new IslandDataStore();

    this.islandsMap = new Map();

    this.tracking = this.refreshTracking();

    const denoJsonPath = path.join(Deno.cwd(), './deno.jsonc');

    const denoJsonsStr = Deno.readTextFileSync(denoJsonPath);

    this.denoJson = jsonc.parse(denoJsonsStr) as DenoConfig;

    this.origBeforeDiff = options.__b;

    this.origDiffed = options.diffed;

    this.origHook = options.__h;

    this.origBeforeRender = options.__r;

    this.origVNodeHook = options.vnode;

    options.__b = (vnode) => this.beforeDiffHook(vnode);

    options.diffed = (vnode) => this.diffedHook(vnode);

    options.__h = (component, index, type) => this.beforeHookStateHook(component, index, type);

    options.__r = (vnode) => this.beforeRenderHook(vnode);

    options.vnode = (vnode) => this.vNodeCreateHook(vnode);
  }

  //#region API Methods
  public AddIsland(
    island: ComponentType,
    path: string,
    contents: string,
  ): void {
    this.islandsMap.set(island.displayName || island.name, {
      Component: island,
      Contents: contents,
      Path: path,
    });
  }

  public AddClientImport(path: string): void {
    this.clientImports.push(path);
  }

  public ClearImports() {
    this.clientImports = [];
  }

  public ClearRendering() {
    this.tracking = {
      ...this.refreshTracking(),
      template: this.tracking.template,
    };

    this.islandsData.ClearData();
  }

  public ClearTemplate() {
    this.tracking = this.refreshTracking();
  }

  public LoadIslands(): Record<string, [string, string]> {
    return Array.from(this.islandsMap).reduce((files, [islandName, island]) => {
      files[island.Path] = [islandName, island.Contents];

      return files;
    }, {} as Record<string, [string, string]>);
  }

  public async RenderPage(
    renderStack: ComponentType<any>[],
    data: Record<string, unknown>,
    ctx: EaCRuntimeContext,
  ): Promise<string> {
    const base = ctx.Runtime.URLMatch.Base.endsWith('/')
      ? ctx.Runtime.URLMatch.Base
      : `${ctx.Runtime.URLMatch.Base}/`;

    let path = ctx.Runtime.URLMatch.Path.endsWith('/')
      ? ctx.Runtime.URLMatch.Path
      : `${ctx.Runtime.URLMatch.Path}/`;

    path = path.startsWith('/') ? `.${path}` : path;

    const baseUrl = new URL(path, base);

    const pageProps: PageProps = {
      Data: data,
      Params: ctx.Params,
      // URL: new URL(ctx.Runtime.URLMatch.Path, ctx.Runtime.URLMatch.Base),
      Component: () => null,
    };

    this.SetRendering();

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

    let bodyHtml = await PreactRenderToString.renderToStringAsync(finalComp);

    if (this.islandsData.HasData()) {
      const islandsClientPath = `./eacIslandsClient.js?revision=${ctx.Runtime.Revision}`;

      bodyHtml += this.islandsData.Render(islandsClientPath);
    }

    this.ClearRendering();

    const page = h(
      'html',
      this.tracking.template.htmlProps ?? {}, //{ lang: opts.lang },
      h(
        'head',
        this.tracking.template.headProps || {},
        h('base', { href: baseUrl.href }),
        h('script', {
          type: 'importmap',
          dangerouslySetInnerHTML: {
            __html: JSON.stringify({
              imports: this.denoJson.imports || {},
            }),
          },
        }),
        !this.tracking.template.userTemplate
          ? h(
            Fragment,
            null,
            h('meta', { charset: 'utf-8' }),
            h('meta', {
              name: 'viewport',
              content: 'width=device-width, initial-scale=1.0',
            }),
          )
          : undefined,
        this.tracking.template.titleNode ??
          h('title', null, 'Fathym EaC Runtime'),
        this.tracking.template.headChildNodes.map((node) => h(node.type, node.props)),
        // opts.preloads.map((src) =>
        //   h("link", { rel: "modulepreload", href: withBase(src, state.basePath) })
        // ),
        this.clientImports.map((src) =>
          h('script', {
            src,
            // nonce,
            type: 'module',
          })
        ),
        // filteredHeadNodes,
      ),
      h('body', {
        ...this.tracking.template.bodyProps,
        dangerouslySetInnerHTML: { __html: bodyHtml },
      }),
    ) as VNode;

    const pageHtml = await PreactRenderToString.renderToStringAsync(page);

    this.ClearTemplate();

    return `<!DOCTYPE html>${pageHtml}`;
  }

  public SetRendering() {
    this.tracking.renderingUserTemplate = true;
  }
  //#endregion

  //#region Helpers
  protected addMarker(vnode: VNode, islandId: string, markerType: 'island' | 'container' = 'island'): VNode {
    return h(
      Fragment,
      {},
      h(
        'script',
        {
          'data-eac-id': islandId,
          'data-eac-island-key': vnode.key,
          type: `application/marker-${markerType}`,
        } as ClassAttributes<HTMLElement>,
      ),
      vnode,
    );

    // return h(
    //   Fragment,
    //   null,
    //   // h(Fragment, {
    //   //   // @ts-ignore unstable property is not typed
    //   //   UNSTABLE_comment: markerText,
    //   // }),
    //   // vnode,
    //   // h(Fragment, {
    //   //   // @ts-ignore unstable property is not typed
    //   //   UNSTABLE_comment: "/" + markerText,
    //   // }),
    // );
  }

  protected excludeChildren(
    props: Record<string, unknown>,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k in props) {
      if (k !== 'children') out[k] = props[k];
    }
    return out;
  }

  protected hasIslandOwner(vnode: VNode<Record<string, unknown>>): boolean {
    let tmpVNode = vnode;

    let owner;

    while ((owner = this.tracking.owners.get(tmpVNode)) !== undefined) {
      const ownerType = owner.type as ComponentType;

      if (this.islandsMap.has(ownerType.displayName || ownerType.name)) {
        return true;
      }

      tmpVNode = owner;
    }

    return false;
  }

  protected refreshTracking(): typeof this.tracking {
    return {
      ownerStack: [],
      owners: new Map<VNode, VNode>(),
      patched: new WeakSet<VNode>(),
      renderingUserTemplate: false,
      template: {
        bodyProps: undefined,
        hasHeadChildren: false,
        headChildNodes: [],
        headProps: undefined,
        htmlProps: undefined,
        slots: new Map(),
        titleNode: undefined,
        userTemplate: false,
      },
    };
  }

  //#region Options Hooks Overrides
  protected beforeDiffHook(vnode: VNode<Record<string, unknown>>) {
    if (this.tracking.renderingUserTemplate) {
      if (typeof vnode.type === 'string') {
        if (vnode.type === 'html') {
          this.tracking.template.userTemplate = true;

          this.tracking.template.htmlProps = this.excludeChildren(vnode.props);

          vnode.type = Fragment;
        } else if (vnode.type === 'head') {
          this.tracking.template.headProps = this.excludeChildren(vnode.props);

          this.tracking.template.hasHeadChildren = true;

          vnode.type = Fragment;

          vnode.props = {
            __eacHead: true,
            children: vnode.props.children,
          };
        } else if (vnode.type === 'body') {
          this.tracking.template.bodyProps = this.excludeChildren(vnode.props);

          vnode.type = Fragment;
        } else if (this.tracking.template.hasHeadChildren) {
          if (vnode.type === 'title') {
            this.tracking.template.titleNode = h('title', vnode.props);
          } else if (vnode.type === 'base') {
            // Do nothing, so it is stripped it out
          } else {
            this.tracking.template.headChildNodes.push({
              type: vnode.type,
              props: vnode.props,
            });
          }

          vnode.type = Fragment;

          vnode.props = { children: null };
        }
      } else if (typeof vnode.type === 'function') {
        const island = this.islandsMap.get(
          vnode.type.displayName || vnode.type.name,
        );

        if (
          vnode.type !== Fragment &&
          island &&
          !this.tracking.patched.has(vnode)
        ) {
          if (!this.hasIslandOwner(vnode)) {
            const originalType = vnode.type;

            this.tracking.patched.add(vnode);

            vnode.type = (props) => {
              // for (const propKey of Object.keys(props)) {
              // const prop = props[propKey];
              if ('children' in props) {
                const children = props.children;

                if (
                  typeof children === 'function' ||
                  (children !== null &&
                    typeof children === 'object' &&
                    !Array.isArray(children) &&
                    !isValidElement(children))
                ) {
                  const name = originalType.displayName ||
                    originalType.name ||
                    'Anonymous';

                  throw new Error(
                    `Invalid JSX child passed to island <${name} />. To resolve this error, pass the data as a standard prop instead.`,
                  );
                }

                // const islandId = this.islandsData.Store(children, props);

                // // @ts-ignore nonono
                // props.children = asIsland(children, islandId);

                // (props as any).children = h(
                //   SlotTracker,
                //   { id: markerText },
                //   children,
                // )
              }

              const islandNode = h(originalType, props) as VNode;

              const islandId = this.islandsData.Store(originalType, props);

              this.tracking.patched.add(islandNode);

              return this.addMarker(islandNode, islandId);
            };
          }
        }
      }
    }

    this.origBeforeDiff?.(vnode);
  }

  protected beforeRenderHook(vnode: VNode<Record<string, unknown>>) {
    if (typeof vnode.type === 'function' && vnode.type !== Fragment) {
      this.tracking.ownerStack.push(vnode);
    }

    this.origBeforeRender?.(vnode);
  }

  protected beforeHookStateHook(
    component: Component,
    index: number,
    type: PreactHookTypes,
  ) {
    console.log('__h');
    console.log(component);

    this.origHook?.(component, index, type);
  }

  protected diffedHook(vnode: VNode<Record<string, unknown>>) {
    if (typeof vnode.type === 'function') {
      if (vnode.type !== Fragment) {
        this.tracking.ownerStack.pop();
      } else if (vnode.props.__eacHead) {
        this.tracking.template.hasHeadChildren = false;
      }
    }

    this.origDiffed?.(vnode);
  }

  protected vNodeCreateHook(vnode: VNode<Record<string, unknown>>): void {
    if (
      typeof vnode.type === 'function' &&
      vnode.type !== Fragment &&
      this.tracking.ownerStack.length > 0
    ) {
      this.tracking.owners.set(
        vnode,
        this.tracking.ownerStack[this.tracking.ownerStack.length - 1],
      );
    }

    if (!vnode.props['eac-bypass-base']) {
      if (
        typeof vnode.props.href === 'string' &&
        vnode.props.href.startsWith('/')
      ) {
        vnode.props.href = `.${vnode.props.href}`;
      }

      if (
        typeof vnode.props.src === 'string' &&
        vnode.props.src.startsWith('/')
      ) {
        vnode.props.src = `.${vnode.props.src}`;
      }
    }

    this.origVNodeHook?.(vnode);
  }
  //#endregion
  //#endregion
}

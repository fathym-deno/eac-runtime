// deno-lint-ignore-file no-explicit-any
import {
  Component,
  ComponentChildren,
  ComponentType,
  Fragment,
  h,
  jsonc,
  path,
  PreactRenderToString,
  type VNode,
} from '../../../src.deps.ts';
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

  protected islandsMap: Map<ComponentType, Island>;

  protected islandsTypeMap: Map<string, ComponentType>;

  protected origBeforeDiff;

  protected origBeforeRender;

  protected origDiffed;

  protected origHook;

  protected origVNodeHook;

  protected ContainerTracker = (props: {
    id: string;
    children?: ComponentChildren;
  }): VNode => {
    this.tracking.containers.delete(props.id);

    return props.children as any;
  };

  protected tracking: {
    containers: Map<string, ComponentChildren>;

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

      islandDepth: number;

      titleNode?: VNode<any>;

      userTemplate: boolean;
    };
  };
  //#endregion

  constructor(protected options: AdvancedPreactOptions) {
    this.clientImports = [];

    this.islandsData = new IslandDataStore();

    this.islandsMap = new Map();

    this.islandsTypeMap = new Map();

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
    this.islandsTypeMap.set(island.displayName || island.name, island);

    this.islandsMap.set(island, {
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
    return Array.from(this.islandsMap).reduce((files, [islandComp, island]) => {
      files[island.Path] = [
        islandComp.displayName || islandComp.name,
        island.Contents,
      ];

      return files;
    }, {} as Record<string, [string, string]>);
  }

  public async RenderPage(
    renderStack: ComponentType<any>[],
    data: Record<string, unknown>,
    ctx: EaCRuntimeContext,
  ): Promise<string> {
    const start = Date.now();

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

    // const componentStack = new Array(renderStack.length).fill(null);

    // for (let i = 0; i < renderStack.length; i++) {
    //   const fn = renderStack[i];
    //   if (!fn) continue;

    //   componentStack[i] = () => {
    //     return h(fn, {
    //       ...pageProps,
    //       Component() {
    //         return h(componentStack[i + 1], null);
    //       },
    //     } as any);
    //   };
    // }

    const routeComponent = renderStack[renderStack.length - 1];

    let finalComp = h(routeComponent, pageProps) as VNode;

    let i = renderStack.length - 1;

    while (i--) {
      const component = renderStack[i];

      const curComp = finalComp;

      finalComp = h(component, {
        ...pageProps,
        Component() {
          return curComp;
        },
      } as any) as VNode;
    }

    let bodyHtml = await PreactRenderToString.renderToStringAsync(finalComp);

    if (this.islandsData.HasData()) {
      const islandsClientPath = `./eacIslandsClient.js?revision=${ctx.Runtime.Revision}`;

      bodyHtml += this.islandsData.Render(islandsClientPath, {
        render: () => this.ClearRendering(),
      });
    } else {
      this.ClearRendering();
    }

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

    let pageHtml = await PreactRenderToString.renderToStringAsync(page);

    if (Array.from(this.tracking.containers.keys()).length > 0) {
      for (const [id, children] of this.tracking.containers.entries()) {
        const containerHtml = await PreactRenderToString.renderToStringAsync(
          h(Fragment, null, children),
        );

        pageHtml += `<template id="${id}>${containerHtml}</template>`;
      }
    }

    this.ClearTemplate();

    console.log(Date.now() - start);

    return `<!DOCTYPE html>${pageHtml}`;
  }

  public SetRendering() {
    this.tracking.renderingUserTemplate = true;
  }
  //#endregion

  //#region Helpers
  protected addMarker(
    vnode: ComponentChildren,
    id: string,
    markerType: 'island' | 'container' = 'island',
  ) {
    // return h(
    //   Fragment,
    //   {},
    //   h('script', {
    //     'data-eac-id': id,
    //     // 'data-eac-island-key': vnode.key,
    //     type: `application/marker-${markerType}`,
    //   } as ClassAttributes<HTMLElement>),
    //   vnode
    // );

    return h(
      Fragment,
      null,
      h(Fragment, {
        // @ts-ignore unstable property is not typed
        UNSTABLE_comment: `eac|${markerType}|${id}`,
      }),
      vnode,
      h(Fragment, {
        // @ts-ignore unstable property is not typed
        UNSTABLE_comment: `/eac|${markerType}|${id}`,
      }),
    );
  }

  protected configureOwners(vnode: VNode): void {
    // if (this.tracking.renderingUserTemplate) {
    this.tracking.owners.set(
      vnode,
      this.tracking.ownerStack[this.tracking.ownerStack.length - 1],
    );
    // }
  }

  protected configureVNode(vnode: VNode): void {
    if (typeof vnode.type === 'string') {
      this.processEaCBypassNodes({
        ...vnode,
        type: vnode.type as string,
      });
    } else if (this.shouldProcessOwners(vnode)) {
      this.configureOwners(vnode);
    }
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

    do {
      owner = this.tracking.owners.get(tmpVNode);

      if (owner) {
        const ownerType = owner.type as ComponentType;

        if (this.islandsMap.has(ownerType)) {
          return true;
        }

        tmpVNode = owner;
      }
    } while (owner !== undefined);

    return false;
  }

  protected loadEaCType(
    vnodeType: string | ComponentType,
  ): string | ComponentType {
    if (typeof vnodeType !== 'string') {
      // Islands are loaded virtually, so when a new vnode is found
      //  to be of an island type, we must override the vnode type
      //  with the virtual island type.
      const islandType = this.islandsTypeMap.get(
        vnodeType.displayName || vnodeType.name,
      );

      if (islandType) {
        vnodeType = islandType;
      }
    }

    return vnodeType;
  }

  protected processComponentMarkup(
    vnode: VNode<Record<string, unknown>>,
  ): void {
    if (typeof vnode.type === 'function') {
      const island = this.islandsMap.get(vnode.type as ComponentType);

      if (
        vnode.type !== Fragment &&
        island &&
        !this.tracking.patched.has(vnode)
      ) {
        this.tracking.template.islandDepth++;

        if (!this.hasIslandOwner(vnode)) {
          const originalType = vnode.type;

          this.tracking.patched.add(vnode);

          vnode.type = (props) => {
            // for (const propKey of Object.keys(props)) {
            // const prop = props[propKey];
            // if ('children' in props) {
            //   if (
            //     typeof props.children === 'function' ||
            //     (props.children !== null &&
            //       typeof props.children === 'object' &&
            //       !Array.isArray(props.children) &&
            //       !isValidElement(props.children))
            //   ) {
            //     const name =
            //       originalType.displayName || originalType.name || 'Anonymous';

            //     throw new Error(
            //       `Invalid JSX child passed to island <${name} />. To resolve this error, pass the data as a standard prop instead.`
            //     );
            //   }

            //   const children: ComponentChildren = props.children;

            //   const containerId = Array.from(
            //     this.tracking.containers.keys()
            //   ).length.toString();
            //   // @ts-ignore nonono
            //   props.children = this.addMarker(
            //     children,
            //     containerId,
            //     'container'
            //   );

            //   this.tracking.containers.set(containerId, children);

            //   (props as any).children = h(
            //     this.ContainerTracker,
            //     { id: containerId },
            //     children
            //   );
            // }

            const islandNode = h(originalType, props) as VNode;

            const islandId = this.islandsData.Store(originalType, props);

            this.tracking.patched.add(islandNode);

            return this.addMarker(islandNode, islandId);
          };
        }
      } else if (vnode.key && this.tracking.template.islandDepth > 0) {
        const child = h(vnode.type, vnode.props);

        vnode.type = Fragment;

        vnode.props = {
          children: this.addMarker(child, `eac-key:${vnode.key}`),
        };
      }
    }
  }

  protected processStandardMarkup(vnode: VNode<Record<string, unknown>>): void {
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
    }
  }

  protected processEaCBypassNodes(
    vnode: { type: string } & VNode<Record<string, unknown>>,
  ) {
    if (!vnode.props['data-eac-bypass-base']) {
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
  }

  protected refreshTracking(): typeof this.tracking {
    return {
      ownerStack: [],
      owners: new Map<VNode, VNode>(),
      patched: new WeakSet<VNode>(),
      renderingUserTemplate: false,
      containers: new Map(),
      template: {
        bodyProps: undefined,
        hasHeadChildren: false,
        headChildNodes: [],
        headProps: undefined,
        htmlProps: undefined,
        islandDepth: 0,
        titleNode: undefined,
        userTemplate: false,
      },
    };
  }

  protected shouldProcessOwners(vnode: VNode): boolean {
    return (
      typeof vnode.type === 'function' &&
      vnode.type !== Fragment &&
      this.tracking.ownerStack.length > 0
    );
  }

  protected vnodeDiffed(vnode: VNode<Record<string, unknown>>) {
    if (typeof vnode.type === 'function') {
      if (vnode.type !== Fragment) {
        if (this.islandsMap.has(vnode.type)) {
          this.tracking.template.islandDepth--;
        }

        this.tracking.ownerStack.pop();
      } else if (vnode.props.__eacHead) {
        this.tracking.template.hasHeadChildren = false;
      }
    }
  }

  //#region Options Hooks Overrides
  protected beforeDiffHook(vnode: VNode<Record<string, unknown>>) {
    if (this.tracking.renderingUserTemplate) {
      if (typeof vnode.type === 'string') {
        this.processStandardMarkup(vnode);
      } else if (typeof vnode.type === 'function') {
        this.processComponentMarkup(vnode);
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
    this.origHook?.(component, index, type);
  }

  protected diffedHook(vnode: VNode<Record<string, unknown>>) {
    this.vnodeDiffed(vnode);

    this.origDiffed?.(vnode);
  }

  protected vNodeCreateHook(vnode: VNode<Record<string, unknown>>): void {
    vnode.type = this.loadEaCType(vnode.type);

    this.configureVNode(vnode);

    this.origVNodeHook?.(vnode);
  }
  //#endregion
  //#endregion
}

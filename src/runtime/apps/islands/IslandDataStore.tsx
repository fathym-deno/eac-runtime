// deno-lint-ignore-file no-explicit-any
import { ComponentType, PreactRenderToString, RenderableProps } from '../../../src.deps.ts';
import { buildIslandData } from './IslandData.tsx';

export type IslandDataStoreType = {
  Name: string;

  Props: RenderableProps<any>;
};

export class IslandDataStore {
  protected data: Map<string, IslandDataStoreType>;

  constructor() {
    this.data = new Map();
  }

  public ClearData(): void {
    this.data.clear();
  }

  public GetData(): Map<string, IslandDataStoreType> {
    return new Map(Array.from(this.data));
  }

  public HasData(): boolean {
    return Array.from(this.data).length > 0;
  }

  public PrepareRender(clientModulePath: string) {
    const IslandData = buildIslandData(this.GetData());

    return IslandData;
  }

  public Render(
    clientModulePath: string,
    events?: {
      pre?: () => void;
      post?: () => void;
      render?: () => void;
    },
  ): string {
    events?.pre?.();

    const IslandData = buildIslandData(this.GetData());

    events?.render?.();

    const islandDataHtml = PreactRenderToString.renderToString(
      <IslandData clientModulePath={clientModulePath} />,
    );

    events?.post?.();

    return islandDataHtml;
  }

  public Store(
    component: ComponentType<RenderableProps<any>>,
    props: RenderableProps<any>,
  ) {
    const islandId = Array.from(this.data.keys()).length.toString();

    this.data.set(islandId, {
      Name: component.displayName || component.name,
      Props: props,
    });

    return islandId;
  }
}

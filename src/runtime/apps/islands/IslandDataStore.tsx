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
    return this.data;
  }

  public HasData(): boolean {
    return Array.from(this.data).length > 0;
  }

  public Render(clientModulePath: string): string {
    const data = JSON.stringify(this.data);

    const IslandData = buildIslandData(this);

    const islandDataHtml = PreactRenderToString.renderToString(
      <IslandData clientModulePath={clientModulePath} />,
    );

    return islandDataHtml;
  }

  public Store(
    component: ComponentType<RenderableProps<any>>,
    props: RenderableProps<any>,
  ) {
    const islandId = Array.from(this.data.keys()).length.toString();

    this.data.set(islandId, {
      Name: (component.displayName || component.name).substring(1),
      Props: props,
    });

    return islandId;
  }
}

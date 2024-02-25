export * as colors from 'https://deno.land/std@0.216.0/fmt/colors.ts';
export * as path from 'https://deno.land/std@0.216.0/path/mod.ts';

export type IoCServiceConstructed = { constructor: Function };

export type IoCServiceConstructor<T> = { new (...args: any[]): T };

export type IoCServiceOptions = {
  Lazy?: boolean;

  Lifetime?: 'transient' | 'scoped';

  Name?: string;

  Type?: Symbol;
};

export type IoCServiceResolutions =
  | IoCServiceConstructed
  | Promise<IoCServiceConstructed>
  | (() => IoCServiceConstructed | Promise<IoCServiceConstructed>);

export type IoCServiceResolver<T> = (svcs: IoCServices) => T | Promise<T>;

export type IoCServices = Map<Symbol, Map<string, IoCServiceResolutions>>;

// export type ServiceResult<T extends ServiceConstructor> = T | Promise<T>;

export class IoCContainer {
  protected services: IoCServices;

  protected symbols: Map<string, symbol>;

  constructor() {
    this.services = new Map<symbol, Map<string, IoCServiceResolutions>>();

    this.symbols = new Map<string, symbol>();
  }

  public async Resolve<T>(ctor: IoCServiceConstructor<T>): Promise<T>;

  public async Resolve<T>(
    ctor: IoCServiceConstructor<T>,
    name: string
  ): Promise<T>;

  public async Resolve<T>(symbol: symbol): Promise<T>;

  public async Resolve<T>(symbol: symbol, name: string): Promise<T>;

  public async Resolve<T>(
    ctorSymbol: IoCServiceConstructor<T> | symbol,
    name?: string
  ): Promise<T> {
    let [symbol] = [ctorSymbol as symbol];

    if (typeof ctorSymbol !== 'symbol') {
      symbol = this.Symbol(ctorSymbol.name);
    }

    name ??= '$default';

    if (!this.services.get(symbol)!.has(name)) {
      throw new Deno.errors.NotFound(
        `No Service for symbol '${symbol.description}' with name '${name}' has been registered.`
      );
    }

    let svc = this.services.get(symbol)!.get(name)!;

    if (typeof svc === 'function') {
      svc = svc();
    }

    if (svc instanceof Promise) {
      svc = await svc;
    }

    return svc as T;
  }

  public Register<T>(
    clazz: IoCServiceConstructor<T>,
    options?: IoCServiceOptions
  ): void | (() => void);

  public Register<T>(
    clazz: IoCServiceConstructor<T>,
    instance: IoCServiceResolver<T>,
    options?: IoCServiceOptions
  ): void | (() => void);

  public Register<T>(
    clazz: IoCServiceConstructor<T>,
    instanceOptions?: IoCServiceResolver<T> | IoCServiceOptions,
    options?: IoCServiceOptions
  ): void | (() => void) {
    let [instance] = [instanceOptions as IoCServiceResolver<T>];

    if (typeof instanceOptions !== 'function') {
      options = instanceOptions as IoCServiceOptions;

      instance = (_svcs) =>
        options?.Lazy
          ? new Promise<T>((resolve) => {
              return resolve(new clazz());
            })
          : new clazz();
    }

    const symbol = options?.Type || this.Symbol(clazz.name);

    const name = options?.Name || '$default';

    if (options?.Lifetime === 'transient') {
      this.services.get(symbol)!.set(name, () => {
        return instance(this.services) as IoCServiceConstructed;
      });
    } else if (options?.Lifetime === 'scoped') {
      const scope = new AbortController();

      scope.signal.onabort = (e) => {
        this.services.get(symbol)!.delete(name);
      };

      this.services
        .get(symbol)!
        .set(name, instance(this.services) as IoCServiceConstructed);

      return () => scope.abort();
    } else {
      this.services
        .get(symbol)!
        .set(name, instance(this.services) as IoCServiceConstructed);
    }
  }

  public Symbol(id: string): symbol {
    if (!this.symbols.has(id)) {
      this.symbols.set(id, Symbol.for(id));
    }

    const symbol = this.symbols.get(id)!;

    if (!this.services.has(symbol)) {
      this.services.set(symbol, new Map<string, IoCServiceResolutions>());
    }

    return symbol;
  }
}

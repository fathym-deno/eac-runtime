export * as colors from 'https://deno.land/std@0.216.0/fmt/colors.ts';
export * as path from 'https://deno.land/std@0.216.0/path/mod.ts';

export type ServiceConstructed = { constructor: Function };

export type ServiceConstructor<T> = { new (...args: any[]): T };

export type ServiceContainer = Map<
  Symbol,
  Map<
    string,
    | ServiceConstructed
    | Promise<ServiceConstructed>
    | (() => ServiceConstructed | Promise<ServiceConstructed>)
  >
>;

export type ServiceResolver =
  | object
  | Promise<object>
  | (() => object | Promise<object>);

// export type ServiceResult<T extends ServiceConstructor> = T | Promise<T>;

export class ServiceRegistry {
  protected services: ServiceContainer;

  protected symbols: Map<string, Symbol>;

  constructor() {
    this.services = new Map<
      Symbol,
      Map<string, object | Promise<object> | (() => object | Promise<object>)>
    >();

    this.symbols = new Map<string, Symbol>();
  }

  public ResolveSingleton<T>(ctor: ServiceConstructor<T>): T {
    const symbol = this.Symbol(ctor.name);

    const name = '$default';

    const svc = this.services.get(symbol)!.get(name)!;

    return svc as T;
  }

  //   public async Resolve<T extends ServiceConstructor>(
  //     symbol: Symbol,
  //     name: string
  //   ): Promise<T> {
  //     if (!this.services.has(symbol)) {
  //       throw new Error(
  //         `No Services for symbol '${symbol}' have been registered.`
  //       );
  //     } else if (!this.services.get(symbol)!.has(name)) {
  //       throw new Error(
  //         `No Service for symbol '${symbol}' with name '${
  //           name || '$default'
  //         } has been registered.`
  //       );
  //     }

  //     let svcResolver = this.services.get(symbol)!.get(name)!;

  //     if (typeof svcResolver === 'function') {
  //       svcResolver = (svcResolver as () => object | Promise<object>)();
  //     }

  //     if (svcResolver instanceof Promise) {
  //       svcResolver = await svcResolver;
  //     }

  //     return svcResolver as T;
  //   }

  public RegisterSingleton<T>(clazz: ServiceConstructor<T>): void;

  public RegisterSingleton<T>(
    clazz: ServiceConstructor<T>,
    instance: (svcs: ServiceContainer) => T
  ): void;

  public RegisterSingleton<T>(
    clazz: ServiceConstructor<T>,
    instance?: (svcs: ServiceContainer) => T
  ): void {
    if (!instance) {
      instance = (svcs) => new clazz();
    }

    const svc = instance(this.services);

    const symbol = this.Symbol(clazz.name);

    const name = '$default';

    this.services.get(symbol)!.set(name, svc as ServiceConstructed);
  }

  //   public Register<T extends ServiceConstructor>(svc: T): void;

  //   public Register<T extends ServiceConstructor>(name: string, svc: Text): void;

  //   public Register<T extends ServiceConstructor>(
  //     symbol: Symbol,
  //     svc: Promise<T>
  //   ): void;

  //   public Register<T extends ServiceConstructor>(
  //     symbol: Symbol,
  //     name: string,
  //     svc: ServiceType<T>
  //   ): void;

  //   public Register<T extends ServiceConstructor>(
  //     symbol: Symbol,
  //     svc: () => ServiceType<T>
  //   ): void;

  //   public Register<T extends ServiceConstructor>(
  //     symbol: Symbol,
  //     name: string,
  //     svc: () => ServiceType<T>
  //   ): void;

  //   public Register<T extends ServiceConstructor>(
  //     svcNameSymbol: T | string | Symbol,
  //     svcNameResolver?: ServiceType<T> | string | (() => ServiceType<T>),
  //     svcResolver?: ServiceType<T> | (() => ServiceType<T>)
  //   ): void {
  //     let [symbol, name]: [Symbol, string] = [
  //       svcNameSymbol as Symbol,
  //       svcNameResolver as string,
  //     ];

  //     if (typeof svcNameSymbol === 'string') {
  //       name = svcNameSymbol;

  //       svcResolver = svcNameResolver as T;

  //       symbol = Symbol(svcResolver.constructor.name);
  //     } else if (typeof svcNameSymbol !== 'symbol') {
  //       svcResolver = svcNameSymbol as T;

  //       name = '$default';

  //       symbol = this.Symbol(svcResolver.constructor.name);
  //     } else if (typeof svcNameResolver === 'string') {
  //       name = svcNameResolver;
  //     } else {
  //       svcResolver = svcNameResolver!;
  //     }

  //     this.services.get(symbol)!.set(name, svcResolver!);
  //   }

  public Symbol(id: string): Symbol {
    if (!this.symbols.has(id)) {
      this.symbols.set(id, Symbol.for(id));
    }

    const symbol = this.symbols.get(id)!;

    if (!this.services.has(symbol)) {
      this.services.set(symbol, new Map<string, ServiceResolver>());
    }

    return symbol;
  }
}

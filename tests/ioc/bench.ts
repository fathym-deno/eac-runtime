import {
  ServiceRegistry,
  assertEquals,
  assertInstanceOf,
} from '../test.deps.ts';

Deno.test('IoC Workbench', async (t) => {
  await t.step('Singleton - No Symbol - Unamed- Default', async () => {
    const svcReg = new ServiceRegistry();

    svcReg.RegisterSingleton(TestDefaultClass);

    const test = svcReg.ResolveSingleton(
      TestDefaultClass
    );

    assertEquals(test.Hello, 'World');
  });
});

export class TestDefaultClass {
  public Hello: string = 'World';
}

export class TestParamsClass {
  constructor(public Hello: string) {}
}

export interface Warrior {
  fight(): string;

  // sneak(): string;
}

export interface Weapon {
  hit(): string;
}

export interface ThrowableWeapon {
  throw(): string;
}

class Katana implements Weapon {
  public hit() {
    return 'cut!';
  }
}

class Shuriken implements ThrowableWeapon {
  public throw() {
    return 'hit!';
  }
}

class Ninja implements Warrior {
  // public constructor(
  //   proteckatana: Weapon,
  //   shuriken: ThrowableWeapon
  // ) {}

  public fight() {
    return 'cut!';
    // return this.katana.hit();
  }

  // public sneak() {
  //   return this.shuriken.throw();
  // }
}

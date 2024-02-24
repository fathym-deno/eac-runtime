import {
  Container,
  assertEquals,
  assertInstanceOf,
  inject,
  injectable,
} from '../test.deps.ts';

Deno.test('IoC Workbench', async (t) => {
  const myContainer = new Container();
  myContainer.bind<Warrior>(TYPES.Warrior).to(Ninja);
  myContainer.bind<Weapon>(TYPES.Weapon).to(Katana);
  myContainer.bind<ThrowableWeapon>(TYPES.ThrowableWeapon).to(Shuriken);

  await t.step('Type Resolution', async () => {
    const ninja = myContainer.get<Warrior>(TYPES.Warrior);

    assertEquals(ninja.fight(), 'cut!'); // true
    assertEquals(ninja.sneak(), 'hit!'); // true
  });
});

export interface Warrior {
  fight(): string;
  sneak(): string;
}

export interface Weapon {
  hit(): string;
}

export interface ThrowableWeapon {
  throw(): string;
}

const TYPES = {
  Warrior: Symbol.for('Warrior'),
  Weapon: Symbol.for('Weapon'),
  ThrowableWeapon: Symbol.for('ThrowableWeapon'),
};

@injectable()
class Katana implements Weapon {
  public hit() {
    return 'cut!';
  }
}

@injectable()
class Shuriken implements ThrowableWeapon {
  public throw() {
    return 'hit!';
  }
}

@injectable()
class Ninja implements Warrior {
  private _katana: Weapon;
  private _shuriken: ThrowableWeapon;

  public constructor(
    @inject(TYPES.Weapon) katana: Weapon,
    @inject(TYPES.ThrowableWeapon) shuriken: ThrowableWeapon
  ) {
    this._katana = katana;
    this._shuriken = shuriken;
  }

  public fight() {
    return this._katana.hit();
  }
  public sneak() {
    return this._shuriken.throw();
  }
}

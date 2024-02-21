import { colors } from '../install.deps.ts';

export function printError(message: string) {
  console.error(colors.bgRed('error: ') + message);
}

export function error(message: string): never {
  printError(message);

  Deno.exit(1);
}

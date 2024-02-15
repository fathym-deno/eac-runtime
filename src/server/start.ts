import { EaCRuntimeConfig } from '../runtime/config/EaCRuntimeConfig.ts';
import { startServer } from './startServer.ts';

export async function start(config: EaCRuntimeConfig): Promise<void> {
  const portEnv = Deno.env.get('PORT');

  if (portEnv) {
    config.Server.port = parseInt(portEnv);
  }

  if (config.Server.port) {
    await startServer(config);
  } else {
    // No port specified, check for a free port. Instead of picking just
    // any port we'll check if the next one is free for UX reasons.
    // That way the user only needs to increment a number when running
    // multiple apps vs having to remember completely different ports.
    let firstError;
    for (let port = 8000; port < 8020; port++) {
      try {
        config.Server.port = port;

        await startServer(config);

        firstError = undefined;

        break;
      } catch (err) {
        if (err instanceof Deno.errors.AddrInUse) {
          // Throw first EADDRINUSE error
          // if no port is free
          if (!firstError) {
            firstError = err;
          }

          continue;
        }

        throw err;
      }
    }

    if (firstError) {
      throw firstError;
    }
  }
}

import { start } from './src/server/start.ts';
import config from './configs/eac-runtime.config.ts';
import { establishKeepAliveMiddleware } from './src/modules/keepAlive/keepAliveMiddleware.ts';

Deno.env.set('EAC_RUNTIME_DEV', 'true');

const devCfg = await config;

const keepAliveMiddleware = await establishKeepAliveMiddleware('/_eac/alive', () => crypto.randomUUID())

devCfg.Middleware.unshift(keepAliveMiddleware);

await start(devCfg);

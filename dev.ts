import { start } from './src/server/start.ts';
import config from './configs/eac-runtime.config.ts';

Deno.env.set('EAC_RUNTIME_DEV', 'true');

await start(await config);

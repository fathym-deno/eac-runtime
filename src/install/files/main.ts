import { start } from '@fathym/eac/runtime';
import { config, configure } from './demo/configs/eac-runtime.config.ts';

await start(await config, configure);

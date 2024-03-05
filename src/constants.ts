import { colors } from './src.deps.ts';

export const EAC_RUNTIME_DEV = () => JSON.parse(Deno.env.get('EAC_RUNTIME_DEV') || 'false');

export const fathymGreen: colors.Rgb = { r: 74, g: 145, b: 142 };

export const IS_BUILDING = Deno.args.includes('build');

export const SUPPORTS_WORKERS = () => JSON.parse(Deno.env.get('SUPPORTS_WORKERS') || 'true');

export const EAC_RUNTIME_DEV = () => JSON.parse(Deno.env.get('EAC_RUNTIME_DEV') || 'false');

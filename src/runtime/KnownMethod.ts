export type KnownMethod = typeof knownMethods[number];

export const knownMethods = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS',
  'PATCH',
] as const;

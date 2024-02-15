export function isPromise<T>(toCheck: object): toCheck is Promise<T> {
  return 'then' in toCheck;
}

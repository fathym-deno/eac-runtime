import { URLMatch } from './URLMatch.ts';

export function buildURLMatch(pattern: URLPattern, req: Request): URLMatch {
  const reqUrl = new URL(req.url);

  const forwardedProto = req.headers.get('x-eac-forwarded-proto') ??
    req.headers.get('x-forwarded-proto') ??
    reqUrl.protocol;

  const host = req.headers.get('x-eac-forwarded-host') ??
    req.headers.get('x-forwarded-host') ??
    req.headers.get('host') ??
    reqUrl.host;

  const reqCheckUrl = new URL(
    reqUrl.href.replace(reqUrl.origin, ''),
    `${forwardedProto}://${host}`.replace('::', ':'),
  );

  const patternResult = pattern.exec(reqCheckUrl.href);

  const path = patternResult!.pathname.groups[0] || '';

  const base = new URL(
    reqCheckUrl.pathname.slice(0, path.length > 0 ? -path.length : undefined),
    reqCheckUrl.origin,
  ).href;

  return {
    Base: base,
    Hash: reqUrl.hash,
    Path: path,
    Search: reqUrl.search,
  };
}

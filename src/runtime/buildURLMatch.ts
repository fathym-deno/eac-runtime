import { URLMatch } from './URLMatch.ts';

export function buildURLMatch(pattern: URLPattern, req: Request): URLMatch {
  const reqUrl = new URL(req.url);

  const forwardedProto = req.headers.get('x-forwarded-proto') || reqUrl.protocol;

  const host = req.headers.get('host') || reqUrl.host;

  const reqCheckUrl = new URL(
    reqUrl.href.replace(reqUrl.origin, ''),
    `${forwardedProto}://${host}`.replace('::', ':'),
  );

  const patternResult = pattern.exec(reqCheckUrl.href);

  const base = patternResult!.inputs[0].toString();

  const path = patternResult!.pathname.groups[0] || '';

  return {
    Base: base.substring(
      0,
      base.length - path.length - reqUrl.search.length - reqUrl.hash.length,
    ),
    Hash: reqUrl.hash,
    Path: path,
    Search: reqUrl.search,
  };
}

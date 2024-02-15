import { DefaultEaCRuntime } from './DefaultEaCRuntime.ts';

export class TracingEaCRuntime extends DefaultEaCRuntime {
  public async Handle(request: Request, info: Deno.ServeHandlerInfo) {
    console.log({ request, remoteAddr: info.remoteAddr });

    const resp = await super.Handle(request, info);

    const cloned = resp.clone();

    console.log({
      body: await cloned.text(),
      resp: cloned,
      remoteAddr: info.remoteAddr,
    });

    return resp;
  }
}

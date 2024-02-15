import { EaCRuntime } from './EaCRuntime.ts';


export class DefaultEaCRuntime implements EaCRuntime {
  public Handle(request: Request, info: Deno.ServeHandlerInfo): Response | Promise<Response> {
    return new Response(
      'Hello, world!' + Deno.env.get('EAC_KEY') + info.remoteAddr
    );
  };
}

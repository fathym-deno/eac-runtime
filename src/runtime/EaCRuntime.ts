export type EaCRuntime = {
  Configure(): Promise<void>;

  Handle: Deno.ServeHandler;
};


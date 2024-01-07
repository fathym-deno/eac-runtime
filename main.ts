const { serve } = Deno;

serve(
  {
    port: 6127,
  },
  async () => {
    return new Response('Hello, world!');
  }
);

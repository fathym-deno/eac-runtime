export function configureKeepAlive(keepAlivePath: string) {
  let ws: WebSocket,
    revision = 0,
    backoffIdx = 0;

  const backgroundColor = 'background-color: #4a918e; color: black',
    textColor = 'color: inherit';

  connect();

  function connect() {
    const url = new URL(keepAlivePath.replace('http', 'ws'));
    ws = new WebSocket(url);

    ws.addEventListener('open', onOpenWs);

    ws.addEventListener('close', onCloseWs);

    ws.addEventListener('message', handleMessage);

    ws.addEventListener('error', handleError);
  }

  function disconnect() {
    ws.removeEventListener('open', onOpenWs);

    ws.removeEventListener('close', onCloseWs);

    ws.removeEventListener('message', handleMessage);

    ws.removeEventListener('error', handleError);

    ws.close();
  }

  function handleMessage(e: MessageEvent) {
    const data = JSON.parse(e.data);
    switch (data.type) {
      case 'keep-alive': {
        if (revision === 0) {
          log('Connected to development server.');

          revision = data.revision;
        } else if (revision < data.revision) {
          handleRefresh();
        }
      }
    }
  }

  function handleRefresh(): void {
    disconnect();

    location.reload();
  }

  function handleError(e: Event) {
    // deno-lint-ignore no-explicit-any
    if (e && (e as any).code === 'ECONNREFUSED') {
      setTimeout(connect, 1000);
    }
  }

  function log(msg: string) {
    console.log(`%c 🐙 EaC Runtime %c ${msg}`, backgroundColor, textColor);
  }

  function onOpenWs() {
    backoffIdx = 0;
  }

  function onCloseWs() {
    disconnect();

    reconnect();
  }

  function reconnect() {
    if (ws.readyState !== ws.CLOSED) return;

    const reconnectTimer = setTimeout(() => {
      if (backoffIdx === 0) {
        log('Connection closed. Trying to reconnect...');
      }

      backoffIdx++;

      try {
        connect();

        clearTimeout(reconnectTimer);
      } catch (_err) {
        reconnect();
      }
    }, Math.max(100 * backoffIdx * 1.5, 3000));
  }

  addEventListener('visibilitychange', () => {
    if (document.hidden) {
      disconnect();
    } else {
      connect();
    }
  });

  // addEventListener("message", (ev) => {
  //   if (ev.origin !== location.origin) return;
  //   if (typeof ev.data !== "string" || ev.data !== "close-error-overlay") {
  //     return;
  //   }

  //   document.querySelector("#fresh-error-overlay")?.remove();
  // });
}

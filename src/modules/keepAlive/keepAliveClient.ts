let ws: WebSocket;
let revision = 0;

let reconnectTimer: number;
const backoff = [
  // Wait 100ms initially, because we could also be
  // disconnected because of a form submit.
  100,
  150,
  200,
  250,
  300,
  350,
  400,
  450,
  500,
  500,
  605,
  750,
  1000,
  1250,
  1500,
  1750,
  2000,
];
let backoffIdx = 0;
function reconnect() {
  if (ws.readyState !== ws.CLOSED) return;

  reconnectTimer = setTimeout(() => {
    if (backoffIdx === 0) {
      console.log(
        `%c EaC Runtime %c Connection closed. Trying to reconnect...`,
        "background-color: #86efac; color: black",
        "color: inherit",
      );
    }
    backoffIdx++;

    try {
      connect();
      clearTimeout(reconnectTimer);
    } catch (_err) {
      reconnect();
    }
  }, backoff[Math.min(backoffIdx, backoff.length - 1)]);
}

function onOpenWs() {
  backoffIdx = 0;
}

function onCloseWs() {
  disconnect();
  reconnect();
}

function connect() {
  const url = new URL("/_eac/alive", location.origin.replace("http", "ws"));
  ws = new WebSocket(
    url,
  );

  ws.addEventListener("open", onOpenWs);
  ws.addEventListener("close", onCloseWs);
  ws.addEventListener("message", handleMessage);
  ws.addEventListener("error", handleError);
}

connect();

function disconnect() {
  ws.removeEventListener("open", onOpenWs);
  ws.removeEventListener("close", onCloseWs);
  ws.removeEventListener("message", handleMessage);
  ws.removeEventListener("error", handleError);
  ws.close();
}

function handleMessage(e: MessageEvent) {
  const data = JSON.parse(e.data);
  switch (data.type) {
    case "keep-alive": {
      if (revision === 0) {
        console.log(
          `%c EaC Runtime %c Connected to development server.`,
          "background-color: #86efac; color: black",
          "color: inherit",
        );
      }

      if (!revision) {
        revision = data.revision;
      } else if (revision != data.revision) {
        disconnect();
        // Needs reload
        location.reload();
      }
    }
  }
}

function handleError(e: Event) {
  // TODO
  // deno-lint-ignore no-explicit-any
  if (e && (e as any).code === "ECONNREFUSED") {
    setTimeout(connect, 1000);
  }
}

// addEventListener("message", (ev) => {
//   if (ev.origin !== location.origin) return;
//   if (typeof ev.data !== "string" || ev.data !== "close-error-overlay") {
//     return;
//   }

//   document.querySelector("#fresh-error-overlay")?.remove();
// });

// Disconnect when the tab becomes inactive and re-connect when it
// becomes active again
addEventListener("visibilitychange", () => {
  if (document.hidden) {
    disconnect();
  } else {
    connect();
  }
});

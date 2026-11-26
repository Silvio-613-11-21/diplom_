var ws = new WebSocket(
  "ws://localhost",
  "protocolOne",
);

ws.send("hi")
import { WebSocketServer } from "ws";

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server });
  let players = [];
  let gameState = { p1: null, p2: null };

  wss.on("connection", (ws, req) => {
    players.push(ws);
    console.log(players.length);

    ws.on("message", (msg) => {
      console.log("Received:", msg.toString());
    });

    ws.on("close", () => {
      console.log("❌ Client disconnected");
    });
  });
}

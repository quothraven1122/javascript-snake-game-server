import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

let waitingPlayer = null;
const rooms = {};

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    console.log("New Player Connected");
    // 1) make player wait if no one is waiting
    if (!waitingPlayer) {
      waitingPlayer = ws;
      ws.send(JSON.stringify({ type: "waiting" }));
      return;
    }

    // 2) if two players are collected - make a room
    const roomId = randomUUID();
    rooms[roomId] = {
      players: [waitingPlayer, ws],
    };
    waitingPlayer.roomId = roomId;
    waitingPlayer.playerId = "p1";
    ws.roomId = roomId;
    ws.playerId = "p2";

    //notify both players of the match
    rooms[roomId].players.forEach((p) => {
      p.send(
        JSON.stringify({
          type: "matched",
          roomId,
          playerId: p.playerId,
          board: rooms[roomId].board,
        })
      );
    });
    waitingPlayer = null;

    ws.on("close", () => {
      const roomId = ws.roomId;
      if (!roomId) return;

      const room = rooms[roomId];
      if (!room) return;

      //find remaining player
      const otherPlayer = room.players.find((p) => p !== ws);

      //delete room
      delete rooms[roomId];

      //put remaining player back in matchmaking
      if (otherPlayer && otherPlayer.readyState === otherPlayer.OPEN) {
        waitingPlayer = otherPlayer;
        otherPlayer.roomId = null;
        otherPlayer.playerId = null;

        otherPlayer.send(JSON.stringify({ type: "waiting" }));
      }

      console.log(`Room ${roomId} destroyed because a player disconnected`);
    });
  });
}

import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

let waitingPlayer = null;
const rooms = {};

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    console.log("New Player Connected");

    //1) 채팅 및 게임 인터렉션 로직
    ws.on("message", (msg) => {
      const text = msg.toString();
      const data = JSON.parse(text);

      const room = rooms[ws.roomId];
      if (!room) return;

      switch (data.type) {
        case "chat":
          room.players.forEach((player) =>
            player.send(
              JSON.stringify({
                type: "chat",
                playerId: ws.playerId,
                message: data.message,
              })
            )
          );
          break;
      }
    });

    //2) 방 나갈때 로직
    ws.on("close", () => {
      const roomId = ws.roomId;
      if (!roomId) return;

      const room = rooms[roomId];
      if (!room) return;

      //상대가 누군지 확인
      const otherPlayer = room.players.find((p) => p !== ws);

      //방 파괴
      delete rooms[roomId];

      //상대방을 다시 매치메이킹에 넣기
      if (otherPlayer && otherPlayer.readyState === otherPlayer.OPEN) {
        waitingPlayer = otherPlayer;
        otherPlayer.roomId = null;
        otherPlayer.playerId = null;

        otherPlayer.send(JSON.stringify({ type: "waiting" }));
      }

      console.log(`Room ${roomId} destroyed because a player disconnected`);
    });

    //3) 매치메이킹 로직
    if (!waitingPlayer) {
      waitingPlayer = ws;
      ws.send(JSON.stringify({ type: "waiting" }));
      return;
    }

    // 두사람이 모이면 방 만들어주기
    const roomId = randomUUID();
    rooms[roomId] = {
      players: [waitingPlayer, ws],
    };
    waitingPlayer.roomId = roomId;
    waitingPlayer.playerId = "p1";
    ws.roomId = roomId;
    ws.playerId = "p2";

    //플레이어 모두에게 매치 성사됨을 알리기
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
  });
}

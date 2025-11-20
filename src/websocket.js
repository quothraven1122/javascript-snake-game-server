import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";
import { Snake } from "./data/Snake.js";

let waitingPlayer = null;
const rooms = {};

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    console.log("New Player Connected");

    //1) 채팅 및 게임 인터렉션 로직
    //채팅 로직
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
        //게임 로직
        case "dir":
          const snake = room.snakes[ws.playerId];
          if (snake && !snake.isDead) {
            snake.setDirection(data.direction);
          }
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
      snakes: {
        p1: new Snake(3, { x: 4, y: 1 }), // example
        p2: new Snake(3, { x: 4, y: 13 }), // example
      },
    };
    const room = rooms[roomId];
    waitingPlayer.roomId = roomId;
    waitingPlayer.playerId = "p1";
    ws.roomId = roomId;
    ws.playerId = "p2";

    //플레이어 모두에게 매치 성사됨을 알리기
    room.players.forEach((p) => {
      p.send(
        JSON.stringify({
          type: "matched",
          roomId,
          playerId: p.playerId,
        })
      );
    });

    // 4) 게임 루프 시작
    room.intervalId = setInterval(() => {
      const { snakes, players } = room;

      Object.values(snakes).forEach((s) => {
        if (!s.isDead) s.move();
      });

      const SIZE = 20;
      // 충돌 체크 (벽)
      Object.values(snakes).forEach((s) => {
        const head = s.body[0];
        if (head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE) {
          s.isDead = true;
        }
      });

      // 뱀끼리 충돌 체크
      const p1 = snakes.p1;
      const p2 = snakes.p2;
      const p1Head = p1.body[0];
      const p2Head = p2.body[0];

      // p1 머리가 p2 몸에 부딪힘
      if (
        p2.body.some(
          (part, idx) => idx !== 0 && part.x === p1Head.x && part.y === p1Head.y
        )
      ) {
        p1.isDead = true;
      }
      //p2 머리가 p1 몸에 부딪힘
      if (
        p1.body.some(
          (part, idx) => idx !== 0 && part.x === p2Head.x && part.y === p2Head.y
        )
      ) {
        p2.isDead = true;
      }
      // 머리끼리 정면 충돌
      if (p1Head.x === p2Head.x && p1Head.y === p2Head.y) {
        p1.isDead = true;
        p2.isDead = true;
      }

      //게임 오버 확인
      if (p1.isDead || p2.isDead) {
        let result;

        if (p1.isDead && p2.isDead) {
          result = { type: "gameOver", result: "tie" };
        } else if (p1.isDead) {
          result = { type: "gameOver", result: "p2" };
        } else {
          result = { type: "gameOver", result: "p1" };
        }

        players.forEach((p) => p.send(JSON.stringify(result)));
        clearInterval(room.intervalId);
        return;
      }

      // 게임 상태 브로드캐스트
      const gameState = {
        type: "gameState",
        p1: { body: snakes.p1.body },
        p2: { body: snakes.p2.body },
      };
      players.forEach((p) => p.send(JSON.stringify(gameState)));
    }, 200);

    waitingPlayer = null;
  });
}

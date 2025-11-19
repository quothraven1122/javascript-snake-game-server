import app from "./app.js";
import { initWebSocket } from "./websocket.js";
import http from "http";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

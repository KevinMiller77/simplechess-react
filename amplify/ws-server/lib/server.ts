import { onNewConnection } from "./connection_handler";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from 'ws';

// Create a simple http server that will serve as the backbone to the websocket server
// As well as a health check for the program
const server = createServer();
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket) => {
  onNewConnection(ws);
});

server.on('upgrade', (request, socket, head) => {
  console.log('WS upgrade request received');
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

server.on('request', (request, response) => {
  console.log(`HTTP Request received @ ${request.url}`);
  if (request.url === '/') {
    console.log('Health check received, responding with 200');
    response.writeHead(200);
    response.end();
  } else {
    // Respond with 403 Forbidden for all other requests
    response.writeHead(403);
    response.end();
  }
});

server.listen(8765);
console.log("Server started on port 8765");
import WebSocket from 'ws';
import { ClientConnection } from './game_client';
import { randomInt, randomUUID } from 'crypto';
import GameSession from './game_session';
import { ReadyMessage, ReconnectedMessage, ReconnectionState, SimpleMove } from '../../src/common/enums';


const clients: ClientConnection[] = [];
const waitingClients: ClientConnection[] = [];
const ongoingGames: GameSession[] = [];

export function onNewConnection(ws: WebSocket) {
  console.log('New client connected');
  const client = new ClientConnection(ws, randomUUID().toString())

  clients.push(client);
}

export function migrateConnection(newConnection: ClientConnection): ReconnectedMessage | ReadyMessage {
  const newConnectionUserId = newConnection.getUserId();
  for (const client of clients) {
    if (client.getSessionId() === newConnection.getSessionId()) {
      continue;
    }

    if (client.getUserId() === newConnectionUserId) {
      console.log(`Migrating connection for user ${newConnectionUserId}. New connection ID: ${newConnection.getSessionId()}, old connection ID: ${client.getSessionId()}`);
      client.migrate(newConnection);
      clients.splice(clients.indexOf(newConnection), 1);

      if (isInPool(newConnection)) {
        return new ReconnectedMessage(
          {
            state: ReconnectionState.IN_POOL,
          }
        );
      }

      if (isInGame(newConnection)) {
        return new ReconnectedMessage(
          {
            state: ReconnectionState.IN_GAME,
            fen: ongoingGames.find(game => game.getPlayers()[0] === newConnectionUserId || game.getPlayers()[1] === newConnectionUserId)!.getFen(),
            color: ongoingGames.find(game => game.getPlayers()[0] === newConnectionUserId || game.getPlayers()[1] === newConnectionUserId)!.isWhitePlayer(newConnectionUserId) ? 'w' : 'b',
          }
        );
      }
    }
  }

  return new ReadyMessage();
}

export function isInPool(client: ClientConnection): boolean {
  for (const waitingClient of waitingClients) {
    if (waitingClient.getUserId() === client.getUserId()) {
      return true;
    }
  }

  return false;
}

export function isInGame(client: ClientConnection): boolean {
  for (const game of ongoingGames) {
    if (game.getPlayers().includes(client.getUserId())) {
      return true;
    }
  }

  return false;
}

export function queuePlayer(client: ClientConnection) {
  if (client.getUserId() === null) {
    console.log('Client is unidentified, will not add to pool');
    return;
  }

  if (isInPool(client)) {
    console.log(`Client ${client.getUserId()} is already in the queue`);
    return;
  }

  if (isInGame(client)) {
    console.log(`Client ${client.getUserId()} is already in a game`);
    return;
  }

  for (const queuedClient of waitingClients) {
    if (queuedClient.getUserId() === client.getUserId()) {
      console.log(`Client ${client.getUserId()} is already in the queue`);
      return;
    }
  }

  waitingClients.push(client);
  console.log(`Client ${client.getUserId()} has been added to the queue. Queue length: ${waitingClients.length}`);

  if (waitingClients.length >= 2) {
    const player1 = waitingClients.shift()!;
    const player2 = waitingClients.shift()!;
    const whitePlayer = randomInt(2) === 0;
    
    console.log('Starting new game, between: ', player1.getUserId(), player2.getUserId(), whitePlayer ? 'Player 1 White' : 'Player 1 Black');
    const game = new GameSession(randomUUID().toString(), player1.getUserId(), player2.getUserId(), whitePlayer);

    ongoingGames.push(game);
    player1.startGame(game);
    player2.startGame(game);
  }
}

export function passMove(client: ClientConnection, move: SimpleMove) {
  const game = ongoingGames.find(game => game.getPlayers().includes(client.getUserId()));

  if (game) {
    const opponent = game.getOpponent(client.getUserId());
    try {
      game.makeMove(move);
    } catch (e) {
      console.log(`Invalid move: ${move}`);
      client.sendInvalidMove(
        game.getFen(), 
        game.isWhitePlayer(client.getUserId()) ? 'w' : 'b'
      );
      return;
    }
    
    const opponentClient = clients.find(client => client.getUserId() === opponent);
    console.log(`Passing move to opponent ${opponent}`);
    if (opponentClient) {
      opponentClient.sendMove(move);
    }


    if (game.isGameOver()) {
      ongoingGames.splice(ongoingGames.indexOf(game), 1);
    }
  }
}

export function passResign(client: ClientConnection) {
  const game = ongoingGames.find(game => game.getPlayers().includes(client.getUserId()));

  if (game) {
    const opponent = game.getOpponent(client.getUserId());
    const opponentClient = clients.find(client => client.getUserId() === opponent);
    console.log(`Resigning game for ${client.getUserId()}`);
    if (opponentClient) {
      opponentClient.sendResign();
    }

    ongoingGames.splice(ongoingGames.indexOf(game), 1);
  }
}
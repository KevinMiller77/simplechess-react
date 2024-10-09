import WebSocket from 'ws';
import { parseMessage, stringifyMessage } from '../../src/common/utils';
import { Color, EchoMessage, ErrorMessage, HandshakeMessage, HandshakeRequestMessage, MessageTypeEnum, ReconnectionState, SimpleMove } from '../../src/common/enums';
import GameSession from './game_session';
import { migrateConnection, passMove, passResign, queuePlayer } from './connection_handler';

export class ClientConnection {
    private handshaken: boolean = false;
    private username: string = '';

    constructor(
        private ws: WebSocket, 
        private sessionId: string
    ) {
        this.ws.on('message', this.onMessage.bind(this));
        
        // On connection, send a handshake request
        this.ws.send(stringifyMessage(new HandshakeRequestMessage()));
    }

    migrate(newClient: ClientConnection) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
        }

        this.ws = newClient.ws;
        this.ws.on('message', this.onMessage.bind(this));
    }

    onMessage(message: string) {
        const msg = parseMessage(message);
        if (msg === undefined) {
            this.ws.send(
                JSON.stringify({
                    type: MessageTypeEnum.ERROR,
                    data: 'Invalid message format'
                })
            )

            return;
        }


        // Ensure we don't receive a handshake message after the handshake
        if (msg.type === MessageTypeEnum.HANDSHAKE) {
            const handshakeMessage = msg as HandshakeMessage;

            if (this.handshaken) {
                console.log(`Client has already identified itself. Sending error. sessionId = ${this.sessionId}`);
                this.ws.send(
                    stringifyMessage(
                        new ErrorMessage('Client has already identified itself')
                    )
                );
            }

            this.handshaken = true;
            this.username = handshakeMessage.data.username;

            const migrationResult = migrateConnection(this);
            if (migrationResult.type === MessageTypeEnum.RECONNECTED) {
                console.log(`Client ${this.username} has reconnected. sessionId = ${this.sessionId}, status = `, migrationResult);
            } else {
                console.log(`Client ${this.username} has connected. sessionId = ${this.sessionId}`);
            }

            this.ws.send(stringifyMessage(migrationResult));
            return;
        }

        // Ensure we have a handshake before processing other messages
        if (!this.handshaken) {
            console.log(`Client has not yet identified itself. Requesting handshake again. sessionId = ${this.sessionId}`);
            this.ws.send(stringifyMessage(new HandshakeRequestMessage()));
            return;
        }

        if (msg.type === MessageTypeEnum.ECHO) {
            const echoMessage = msg as EchoMessage;

            console.log(`Echoing message: ${echoMessage.data}. sessionId = ${this.sessionId}, username = ${this.username}`);
            this.ws.send(
                stringifyMessage(
                    new EchoMessage(echoMessage.data)
                )
            );
            return;
        }

        if (msg.type === MessageTypeEnum.ERROR) {
            const errorMessage = msg as ErrorMessage;
            console.log(`Received error message: ${errorMessage.data}. sessionId = ${this.sessionId}, username = ${this.username}`);
            return;
        }

        if (msg.type === MessageTypeEnum.REQUEST_GAME) {
            queuePlayer(this);
            return;
        }

        if (msg.type === MessageTypeEnum.MOVE) {
            console.log(`Received move message. sessionId = ${this.sessionId}, username = ${this.username}, move = `, msg.data);
            passMove(this, msg.data as SimpleMove);
            return;
        }

        if (msg.type === MessageTypeEnum.RESIGN) {
            console.log(`Received resign message. sessionId = ${this.sessionId}, username = ${this.username}`);
            passResign(this);
            return;
        }
    }

    startGame(gameSession: GameSession) {
        const isWhite = gameSession.isWhitePlayer(this.username);
        console.log(`Starting game for ${this.username}. sessionId = ${this.sessionId}, color = ${isWhite ? 'w' : 'b'}`);

        this.ws.send(
            stringifyMessage(
                {
                    type: MessageTypeEnum.START_GAME,
                    data: {
                        color: isWhite ? 'w' : 'b'
                    }
                }
            )
        );
    }

    sendMove(move: SimpleMove) {
        this.ws.send(
            stringifyMessage(
                {
                    type: MessageTypeEnum.MOVE,
                    data: move
                }
            )
        );
    }

    sendResign() {
        this.ws.send(
            stringifyMessage(
                {
                    type: MessageTypeEnum.RESIGN,
                    data: {}
                }
            )
        );
    }

    sendInvalidMove(fen: string, color: Color) {
        this.ws.send(
            stringifyMessage(
                {
                    type: MessageTypeEnum.RECONNECTED,
                    data: {
                        state: ReconnectionState.IN_GAME,
                        fen,
                        color
                    }
                }
            )
        );
    }

    getUserId() {
        return this.username;
    }

    getSessionId() {
        return this.sessionId;
    }
}
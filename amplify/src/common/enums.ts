export interface ClientData {
    id: string,
    username: string
}

export enum MessageTypeEnum {
    HANDSHAKE_REQUEST = "HANDSHAKE_REQUEST",
    HANDSHAKE = "HANDSHAKE",
    READY = "READY",
    RECONNECTED = "RECONNECTED",
    ECHO = "ECHO",
    ERROR = "ERROR",
    REQUEST_GAME = "REQUEST_GAME",
    START_GAME = "START_GAME",
    MOVE = "MOVE",
    OFFER_DRAW = "OFFER_DRAW",
    ACCEPT_DRAW = "ACCEPT_DRAW",
    DECLINE_DRAW = "DECLINE_DRAW",
    RESIGN = "RESIGN",
}

export interface SimpleMove {
    from: string;
    to: string;
    promotion?: string;
}

export type Color = 'w' | 'b';


export enum ReconnectionState {
    IN_POOL = 'IN_POOL',
    IN_GAME = 'IN_GAME',
}
export interface ReconnectionDetails {
    state: ReconnectionState;
    fen?: string;
    color?: Color;
}

export interface IMessage {
    type: MessageTypeEnum,
    data: unknown
}

export class HandshakeRequestMessage implements IMessage {
    type = MessageTypeEnum.HANDSHAKE_REQUEST;
    data = {};
}

export class HandshakeMessage implements IMessage {
    type = MessageTypeEnum.HANDSHAKE;
    data: {
        username: string
    };

    constructor(username: string) {
        this.data = { username };
    }
}

export class ReadyMessage implements IMessage {
    type = MessageTypeEnum.READY;
    data = {};
}

export class ReconnectedMessage implements IMessage {
    type = MessageTypeEnum.RECONNECTED;
    data: ReconnectionDetails;

    constructor(data: ReconnectionDetails) {
        this.data = data;
    }
}

export class EchoMessage implements IMessage {
    type = MessageTypeEnum.ECHO
    data: string;

    constructor(data: string) {
        this.data = data;
    }
}

export class ErrorMessage implements IMessage {
    type = MessageTypeEnum.ERROR;
    data: string;

    constructor(error: string) {
        this.data = error;
    }
}

export class JoinGameQueueMessage implements IMessage {
    type = MessageTypeEnum.REQUEST_GAME;
    data = {};
}

export class StartGameMessage implements IMessage {
    type = MessageTypeEnum.START_GAME;
    data: {
        color: Color
    };

    constructor(color: Color) {
        this.data = { color };
    }
}

export class MoveMessage implements IMessage {
    type = MessageTypeEnum.MOVE;
    data: SimpleMove

    constructor(move: SimpleMove) {
        this.data = move;
    }
}

export class OfferDrawMessage implements IMessage {
    type = MessageTypeEnum.OFFER_DRAW;
    data = {};
}

export class AcceptDrawMessage implements IMessage {
    type = MessageTypeEnum.ACCEPT_DRAW;
    data = {};
}

export class DeclineDrawMessage implements IMessage {
    type = MessageTypeEnum.DECLINE_DRAW;
    data = {};
}

export class ResignMessage implements IMessage {
    type = MessageTypeEnum.RESIGN;
    data = {};
}

export type Message = HandshakeRequestMessage | HandshakeMessage | EchoMessage | ErrorMessage | JoinGameQueueMessage | StartGameMessage | MoveMessage | ReadyMessage | ReconnectedMessage;
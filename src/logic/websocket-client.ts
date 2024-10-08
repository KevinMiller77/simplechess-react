import { HandshakeMessage, Message, MessageTypeEnum, JoinGameQueueMessage as JoinPoolMessage, SimpleMove, MoveMessage } from "../../../common/enums";
import { parseMessage, stringifyMessage } from "../../../common/utils";

interface WebSocketClientProps {
    host: string;
    userId: string;
    handleMessage: (message: Message) => void;
}

export class ChessConnectionClient {
  private ws: WebSocket;

  constructor(private props: WebSocketClientProps) {
    this.ws = new WebSocket(props.host);
    this.ws.onopen = this.onSocketOpen;
    this.ws.onmessage = this.onSocketMessage;
    this.ws.onclose = this.onSocketClose
    this.ws.onerror = this.onSocketError;
  }

  getUserId() {
    return this.props.userId;
  }

  joinPool() {
    this.send(new JoinPoolMessage());
  }

  makeMove(move: SimpleMove) {
    this.send(new MoveMessage(move));
  }

  close() {
    this.ws?.close();
  }

  send(message: Message) {
    this.ws?.send(stringifyMessage(message));
  }

  private onSocketMessage = (message: MessageEvent) => {
      const msg = parseMessage(message.data);
      if (msg === undefined) {
          console.log(`Error parsing ws message: ${message}`);
          return;
      }

      if (msg.type === MessageTypeEnum.HANDSHAKE_REQUEST) {
          console.log('Received handshake request');
          this.send(new HandshakeMessage(this.props.userId));
          return;
      }

      if (msg.type === MessageTypeEnum.READY) {
          console.log('Received ready message, connection established');
          return;
      }

      console.log('Received from server: ', message);
      this.props.handleMessage(msg);
  };

  private onSocketClose = () => {
      console.log('Connection closed');
  };

  private onSocketError = (error: Event) => {
      console.error(`WebSocket error: ${error}`);
  };

  private onSocketOpen = () => {
      console.log('Connected to server');
  };
}

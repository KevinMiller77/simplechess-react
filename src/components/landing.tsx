import { Component } from 'react';
import 'react-tabs/style/react-tabs.css';
import '../css/Landing.css';
import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { ChessConnectionClient } from '../logic/websocket-client';
import { Hub } from 'aws-amplify/utils';
import { Message, MessageTypeEnum, MoveMessage, ReconnectedMessage, ReconnectionState, SimpleMove, StartGameMessage } from '../../../common/enums';
import { Chess, Color } from 'chess.js';
import { Chessboard } from 'react-chessboard';

interface LandingProps {
}

interface LandingState {
  userId: string;
  client: ChessConnectionClient | null;
  queueing: boolean;
  inGame: boolean;
  playerColor: Color;
  game: Chess;
}

class Landing extends Component<LandingProps, LandingState> {
  constructor(props: LandingProps) {
    super(props);
    this.state = {
      userId: '',
      client: null,
      queueing: false,
      inGame: false,
      game: new Chess(),
      playerColor: 'w',
    };

    getCurrentUser().then(user => {
      if (user && !this.state.client) {
        this.setState(
          { 
            userId: user.userId,
            client: new ChessConnectionClient(
              {
                host: 'ws://54.81.109.13:8765',
                userId: user.userId,
                handleMessage: this.handleMessage,
              }
            )
          }
        );
      }
    }).catch(() => {});

    Hub.listen('auth', ( { payload } ) => {
      switch (payload.event) {
        case 'signedIn':
          console.log('user have been signedIn successfully.');
          this.setState(
            { 
              userId: payload.data.userId,
              client: new ChessConnectionClient(
                {
                  host: 'ws://localhost:8765',
                  userId: payload.data.userId,
                  handleMessage: () => console.log('Message received'),
                }
              )
            }
          );
          break;
        case 'signedOut':
          console.log('user have been signedOut successfully.');
          if (this.state.client) {
            this.state.client.close();
          }
          this.setState({ userId: '', client: null });
          break;
        case 'tokenRefresh':
          console.log('auth tokens have been refreshed.');
          break;
        case 'tokenRefresh_failure':
          console.log('failure while refreshing auth tokens.');
          break;
        case 'signInWithRedirect':
          console.log('signInWithRedirect API has successfully been resolved.');
          break;
        case 'signInWithRedirect_failure':
          console.log('failure while trying to resolve signInWithRedirect API.');
          break;
        case 'customOAuthState':
          console.log('custom state returned from CognitoHosted UI');
          break;
      }
    });
  }

  handleMessage = (message: Message) => {
    console.log('Received from server in landing: ', message);
    if (message.type === MessageTypeEnum.RECONNECTED) {
      const msg = message as ReconnectedMessage;
      console.log(`Reconnected to server with state: ${msg.data.state}`);
      if (msg.data.state === ReconnectionState.IN_POOL) {
        this.setState({ queueing: true });
      } else {
        const { fen, color } = msg.data;
        this.setState(
          { 
            inGame: true,
            game: new Chess(fen),
            playerColor: color!,
          }
        );
      }
    }

    if (message.type === MessageTypeEnum.START_GAME) {
      const msg = message as StartGameMessage;
      console.log('Received start game message');
      this.setState(
        { 
          inGame: true,
          game: new Chess(),
          playerColor: msg.data.color,
        }
      );
    }

    if (message.type === MessageTypeEnum.MOVE) {
      const msg = message as MoveMessage;
      console.log('Received move message');

      const { game } = this.state;
      if (game) {
        this.makeMove(msg.data);
      }
    }

    if (message.type === MessageTypeEnum.RESIGN) {
      console.log('Received resign message');
      alert('Your opponent resigned! You won!');

      this.setState({
        queueing: false,
        inGame: false,
        game: new Chess(),
        playerColor: 'w',
      });
    }
  }

  queueForGame = () => {
    if (this.state.client) {
      console.log("Joining game pool");
      this.state.client.joinPool();

      this.setState({ queueing: true });
    } else {
      alert("Please sign-in to join the game pool");
    }
  }

  onDrop = (sourceSquare: string, targetSquare: string) => {
    const { game, playerColor } = this.state;
    if (game?.turn() === playerColor) {
      console.log(`Player ${playerColor} moved from ${sourceSquare} to ${targetSquare}`);
      const move = { from: sourceSquare, to: targetSquare, promotion: 'q' };
      this.state.client?.send(new MoveMessage(move));
      this.makeMove(move);
    }
    return false;
  };

  makeMove = (move: SimpleMove) => {
    const { game } = this.state;
    const turn = game?.turn()
    const result = game?.move(move);
    if (result != null) {
      this.setState({ game });
    }

    if (game?.isCheckmate()) {
      if (turn === this.state.playerColor) {
        alert('Checkmate! You won!');
      } else {
        alert('Checkmate! You lost!'); 
      }
      console.log('Checkmate!');
      this.setState({
        queueing: false,
        inGame: false,
        game: new Chess(),
        playerColor: 'w',
      });
    }
    if (game?.isDraw()) {
      alert('Draw!');
      console.log('Draw!');
      this.setState({
        queueing: false,
        inGame: false,
        game: new Chess(),
        playerColor: 'w',
      });
    }
  };

  resign = () => {
    this.state.client?.resign();
    alert('You resigned! You lost!');
    this.setState({
      queueing: false,
      inGame: false,
      game: new Chess(),
      playerColor: 'w',
    });
  }

  renderChessboard = () => {
    const { game, playerColor } = this.state;
    return (
      <div>
        <Chessboard
            position={game.fen()}
            onPieceDrop={this.onDrop}
            boardOrientation={playerColor === 'w' ? 'white' : 'black'}
            arePremovesAllowed={true}
            areArrowsAllowed={true}
            showBoardNotation={true}
            showPromotionDialog={true}
            
            />
        <button onClick={ this.resign }> Resign (No confirmation) </button>
      </div>
    );
  };

  render() {
    return (
      <div>
        <h1>Welcome to Simple Chess</h1>
        <Authenticator>
          <button onClick={() => { signOut() }}>Logout</button>
          <h2>Welcome to the Chess Game</h2>
          <p>Select an option to start playing:</p>
          {
            this.state.inGame ? 
              ( this.renderChessboard() ) :
              <button onClick={ this.queueForGame }>{ this.state.queueing ? "Waiting for Player..." : "Join a Pool" }</button>
          }
          
        </Authenticator>
      </div>
    );
  }
}

export default Landing;
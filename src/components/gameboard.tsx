import { Component } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Color } from 'chess.js';
import { SimpleMove } from '../../amplify/src/common/enums';

type GameBoardState = {
  inProgress: boolean;
  game: Chess;
  playerColor: Color;
};

interface GameBoardProps {
  playerColor: Color;
  onDrop: (move: SimpleMove) => void;
}

class GameBoard extends Component<GameBoardProps, GameBoardState> {
  constructor(props: GameBoardProps) {
    super(props);
    this.state = {
      inProgress: false,
      game: new Chess(),
      playerColor: this.props.playerColor,
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  makeMove = (move: SimpleMove) => {
    const { game } = this.state;
    const result = game.move(move);
    if (result != null) {
      this.setState({ game });
    }
  };

  onDrop = (sourceSquare: string, targetSquare: string) => {
    const { game, playerColor } = this.state;
    if (game.turn() === playerColor) {
      const move = { from: sourceSquare, to: targetSquare, promotion: 'q' };
      this.makeMove(move);
      this.props.onDrop({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    }
    return false;
  };

  renderChessboard = () => {
    const { game, playerColor } = this.state;
    return (
      <div>
        <Chessboard
            position={game.fen()}
            onPieceDrop={this.onDrop}
            boardOrientation={playerColor === 'w' ? 'white' : 'black'}
            />
      </div>
    );
  };

  render() {
    return <div>{this.renderChessboard()}</div>;
  }
}

export default GameBoard;
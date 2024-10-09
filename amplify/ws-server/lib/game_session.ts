import { Chess } from "chess.js";
import { SimpleMove } from "../../src/common/enums";

class GameSession {
    constructor(
        public readonly id: string,
        public readonly player1: string,
        public readonly player2: string,
        public readonly whitePlayer: boolean,
        public readonly game: Chess = new Chess(),
    ) {}

    getGameId() {
        return this.id;
    }

    getPlayers() {
        return [this.player1, this.player2];
    }

    getOpponent(player: string) {
        if (player === this.player1) {
            return this.player2;
        } else if (player === this.player2) {
            return this.player1;
        } else {
            return null;
        }
    }

    isPlayer(player: string) {
        return player === this.player1 || player === this.player2;
    }

    isWhitePlayer(player: string) {
        return (player === this.player1 && this.whitePlayer) || (player === this.player2 && !this.whitePlayer);
    }

    makeMove(move: SimpleMove) {
        this.game.move(move);
    }

    isGameOver() {
        return this.game.isCheckmate() || this.game.isDraw();
    }

    getFen() {
        return this.game.fen();
    }
}

export default GameSession;
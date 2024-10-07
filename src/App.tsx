import React, { useState, useEffect } from 'react';
import './App.css';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import Amplify from 'aws-amplify';
import awsconfig from './aws-exports';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

Amplify.configure(awsconfig);

type Move = {
  from: string;
  to: string;
  promotion?: string;
};

type GameData = {
  result: string;
};

const App: React.FC = () => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [games, setGames] = useState<GameData[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080'); // Update with your websocket server URL
    setSocket(ws);

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'move') {
        const newGame = new Chess(game.fen());
        newGame.move(data.move);
        setGame(newGame);
      } else if (data.type === 'start') {
        setPlayerColor(data.color);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, [game.fen()]);

  const makeMove = (move: Move) => {
    const newGame = new Chess(game.fen());
    const result = newGame.move(move);
    if (result) {
      setGame(newGame);
      if (socket) {
        socket.send(JSON.stringify({ type: 'move', move }));
      }
    }
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (game.turn() === playerColor) {
      makeMove({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    }
    return false;
  };

  const renderChessboard = () => (
    <Chessboard position={game.fen()} onPieceDrop={onDrop} boardOrientation={playerColor === 'w' ? 'white' : 'black'} />
  );

  return (
    <div className="App">
      <h1>WebSocket Chess Game</h1>
      <Tabs selectedIndex={currentTab} onSelect={(index) => setCurrentTab(index)}>
        <TabList>
          <Tab>Home</Tab>
          <Tab>Current Game</Tab>
          <Tab>Past Games</Tab>
        </TabList>

        <TabPanel>
          <h2>Welcome to the Chess Game</h2>
          <p>Select an option to start playing:</p>
          <button onClick={() => console.log('Join a pool')}>Join a Pool</button>
          <button onClick={() => console.log('Play against Computer')}>Play Against Computer</button>
        </TabPanel>

        <TabPanel>
          <h2>Current Game</h2>
          {renderChessboard()}
        </TabPanel>

        <TabPanel>
          <h2>Past Games</h2>
          <ul>
            {games.map((game, index) => (
              <li key={index}>Game {index + 1}: {game.result}</li>
            ))}
          </ul>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default withAuthenticator(App);
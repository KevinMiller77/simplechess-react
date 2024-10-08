import React from 'react';
import './css/App.css';
import 'react-tabs/style/react-tabs.css';
import '@aws-amplify/ui-react/styles.css'
import LandingWithAuthenticator from './components/landing';

const App: React.FC = () => {
  return (
    <main>
      <LandingWithAuthenticator />
    </main>
  )
};

export default App;
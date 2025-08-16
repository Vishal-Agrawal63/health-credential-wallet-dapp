// PATH FROM REPO ROOT: /client/src/App.jsx
import React from 'react';
import AppRoutes from './routes';
import { Web3Provider } from './lib/web3';
import { AuthProvider } from './firebase';

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <AppRoutes />
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
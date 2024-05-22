import React from 'react';
import ReactDOM from 'react-dom/client';

import StarknetProvider from './StarknetProvider.js';

import './index.css';
import App from './App.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <StarknetProvider>
      <App />
    </StarknetProvider>
  </React.StrictMode>
);

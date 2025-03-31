
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Load the original script.js to ensure functionality
const scriptElement = document.createElement('script');
scriptElement.src = '/frontend/script.js';
scriptElement.type = 'module';
document.body.appendChild(scriptElement);

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

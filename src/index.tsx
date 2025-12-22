import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';

// Desabilitar webpack dev server em produção
if (process.env.NODE_ENV === 'production') {
  // Remover qualquer referência ao webpack dev server
  if (typeof window !== 'undefined') {
    // @ts-ignore
    if (window.__webpack_dev_server_client__) {
      // @ts-ignore
      delete window.__webpack_dev_server_client__;
    }
    // Desabilitar tentativas de conexão do webpack dev server
    // @ts-ignore
    if (window.webpackHotUpdate) {
      // @ts-ignore
      window.webpackHotUpdate = () => {};
    }
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


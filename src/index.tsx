import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';

// Desabilitar webpack dev server e React Refresh em produção
if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
  // Interceptar e bloquear tentativas de conexão do webpack dev server
  const originalWebSocket = window.WebSocket;
  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // Bloquear apenas conexões do webpack dev server (que tentam conectar na porta 3000 ou contêm webpack-dev-server)
      if (urlString.includes('webpack-dev-server') || 
          urlString.includes(':3000/ws') ||
          (urlString.includes('/ws') && urlString.includes('app.clerky.com.br'))) {
        console.warn('🚫 Webpack dev server bloqueado em produção:', urlString);
        // Criar um WebSocket "fake" que não conecta mas não gera erro
        try {
          super('ws://localhost:1', protocols);
        } catch {
          // Ignorar erro de conexão
        }
        return;
      }
      super(url, protocols);
    }
  } as typeof WebSocket;

  // Remover referências ao webpack dev server
  // @ts-ignore
  if (window.__webpack_dev_server_client__) {
    // @ts-ignore
    delete window.__webpack_dev_server_client__;
  }
  // @ts-ignore
  if (window.webpackHotUpdate) {
    // @ts-ignore
    window.webpackHotUpdate = () => {};
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


import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { DispatchStatus } from '../services/api';

// Normalizar URL do WebSocket (converter HTTP para WS e HTTPS para WSS)
const getSocketUrl = (): string => {
  const url = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4331';
  
  try {
    const urlObj = new URL(url);
    
    // Se for HTTPS, converter para WSS
    if (urlObj.protocol === 'https:') {
      // Remover porta padrão (443) se existir
      if (urlObj.port === '443' || !urlObj.port) {
        return `wss://${urlObj.hostname}`;
      }
      return `wss://${urlObj.hostname}:${urlObj.port}`;
    }
    
    // Se for HTTP, converter para WS
    if (urlObj.protocol === 'http:') {
      // Remover porta padrão (80) se existir
      if (urlObj.port === '80' || !urlObj.port) {
        return `ws://${urlObj.hostname}`;
      }
      return `ws://${urlObj.hostname}:${urlObj.port}`;
    }
    
    // Se já for ws:// ou wss://, retornar como está
    return url;
  } catch (error) {
    // Se não for uma URL válida, retornar como está
    console.warn('⚠️ URL do WebSocket inválida:', url);
    return url;
  }
};

const SOCKET_URL = getSocketUrl();

export interface NewMessageData {
  instanceId: string;
  contactId: string;
  messages: Array<{
    id: string;
    messageId: string;
    fromMe: boolean;
    messageType: string;
    content: string;
    mediaUrl: string | null;
    timestamp: string;
    read: boolean;
  }>;
}

export interface DispatchUpdateData {
  dispatch: {
    id: string;
    name: string;
    status: DispatchStatus;
    stats: {
      total: number;
      sent: number;
      failed: number;
      invalid: number;
    };
    settings?: any;
    schedule?: any;
    defaultName?: string;
    createdAt: string;
    startedAt?: string | null;
    completedAt?: string | null;
    updatedAt: string;
  };
}

// Singleton para manter uma única conexão WebSocket por token
let globalSocket: Socket | null = null;
let globalToken: string | null = null;
const callbacks = new Set<{
  onStatusUpdate?: (data: { instanceId: string; status: string }) => void;
  onNewMessage?: (data: NewMessageData) => void;
  onContactUpdate?: () => void;
  onDispatchUpdate?: (data: DispatchUpdateData) => void;
  onWorkflowContactUpdate?: (data: { workflowId: string; contactPhone: string; instanceId: string }) => void;
  onGroupsUpdate?: (data: { instanceId: string }) => void;
}>();

/**
 * Cria um objeto de callback com getters que sempre leem de callbackRef.current
 * Isso garante que sempre use a versão mais recente do callback
 */
const createCallbackObj = (callbackRef: React.MutableRefObject<{
  onStatusUpdate?: (data: { instanceId: string; status: string }) => void;
  onNewMessage?: (data: NewMessageData) => void;
  onContactUpdate?: () => void;
  onDispatchUpdate?: (data: DispatchUpdateData) => void;
  onWorkflowContactUpdate?: (data: { workflowId: string; contactPhone: string; instanceId: string }) => void;
  onGroupsUpdate?: (data: { instanceId: string }) => void;
}>) => ({
  get onStatusUpdate() { return callbackRef.current.onStatusUpdate; },
  get onNewMessage() { return callbackRef.current.onNewMessage; },
  get onContactUpdate() { return callbackRef.current.onContactUpdate; },
  get onDispatchUpdate() { return callbackRef.current.onDispatchUpdate; },
  get onWorkflowContactUpdate() { return callbackRef.current.onWorkflowContactUpdate; },
  get onGroupsUpdate() { return callbackRef.current.onGroupsUpdate; },
});

/**
 * Desconecta o socket de forma segura, tratando erros
 */
const safeDisconnect = (socket: Socket | null): void => {
  if (!socket) return;
  try {
    if (socket.connected) {
      socket.disconnect();
    }
  } catch (e) {
    // Ignorar erros ao desconectar
  }
};

export const useSocket = (
  token: string | null,
  onStatusUpdate?: (data: { instanceId: string; status: string }) => void,
  onNewMessage?: (data: NewMessageData) => void,
  onContactUpdate?: () => void,
  onDispatchUpdate?: (data: DispatchUpdateData) => void,
  onWorkflowContactUpdate?: (data: { workflowId: string; contactPhone: string; instanceId: string }) => void,
  onGroupsUpdate?: (data: { instanceId: string }) => void
) => {
  const callbackRef = useRef({ onStatusUpdate, onNewMessage, onContactUpdate, onDispatchUpdate, onWorkflowContactUpdate, onGroupsUpdate });

  // Atualizar referências dos callbacks
  useEffect(() => {
    callbackRef.current = { onStatusUpdate, onNewMessage, onContactUpdate, onDispatchUpdate, onWorkflowContactUpdate, onGroupsUpdate };
  }, [onStatusUpdate, onNewMessage, onContactUpdate, onDispatchUpdate, onWorkflowContactUpdate, onGroupsUpdate]);

  useEffect(() => {
    if (!token) {
      return;
    }

    // Se já existe uma conexão com o mesmo token, apenas adicionar callbacks
    // O socket.io já gerencia a reconexão automaticamente
    if (globalSocket && globalToken === token) {
      const callbackObj = createCallbackObj(callbackRef);
      callbacks.add(callbackObj);

      // Cleanup: remover callbacks quando componente desmontar
      return () => {
        callbacks.delete(callbackObj);
        
        // Se não há mais callbacks, agendar desconexão (com delay para evitar Strict Mode)
        if (callbacks.size === 0 && globalSocket) {
          const timeoutId = setTimeout(() => {
            if (callbacks.size === 0 && globalSocket && globalToken === token) {
              console.log('🔌 [Socket] Nenhum callback ativo, desconectando...');
              safeDisconnect(globalSocket);
              globalSocket = null;
              globalToken = null;
            }
          }, 2000);
          
          return () => clearTimeout(timeoutId);
        }
      };
    }

    // Se token mudou, desconectar conexão antiga
    if (globalSocket && globalToken !== token) {
      console.log('🔌 [Socket] Token mudou, desconectando conexão antiga...');
      safeDisconnect(globalSocket);
      globalSocket = null;
      globalToken = null;
      callbacks.clear();
    }

    // Se não há conexão, criar nova
    if (!globalSocket) {
      console.log('🔌 [Socket] Iniciando conexão WebSocket...', SOCKET_URL);

      // Criar nova conexão
      const socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      globalSocket = socket;
      globalToken = token;

      // Adicionar callbacks deste hook
      const callbackObj = createCallbackObj(callbackRef);
      callbacks.add(callbackObj);

      // Função para registrar todos os listeners de eventos
      const registerEventListeners = () => {
        // Remover listeners antigos para evitar duplicação
        socket.off('instance-status-updated');
        socket.off('contact-updated');
        socket.off('new-message');
        socket.off('dispatch-updated');
        socket.off('workflow-contact-updated');
        socket.off('groups-updated');
        socket.off('error');

      socket.on('instance-status-updated', (data: { instanceId: string; status: string }) => {
        callbacks.forEach((cb) => {
          if (cb.onStatusUpdate) {
            cb.onStatusUpdate(data);
          }
        });
      });

      socket.on('contact-updated', () => {
        callbacks.forEach((cb) => {
          if (cb.onContactUpdate) {
            cb.onContactUpdate();
          }
        });
      });

      socket.on('new-message', (data: NewMessageData) => {
        callbacks.forEach((cb) => {
          if (cb.onNewMessage) {
            cb.onNewMessage(data);
          }
            // Não chamar onContactUpdate aqui - o handleNewMessage já atualiza o card
            // O onContactUpdate será chamado apenas quando necessário via evento 'contact-updated'
        });
      });

      socket.on('dispatch-updated', (data: DispatchUpdateData) => {
        callbacks.forEach((cb) => {
          if (cb.onDispatchUpdate) {
            cb.onDispatchUpdate(data);
          }
        });
      });

        socket.on('workflow-contact-updated', (data: { workflowId: string; contactPhone: string; instanceId: string }) => {
          callbacks.forEach((cb) => {
            if (cb.onWorkflowContactUpdate) {
              cb.onWorkflowContactUpdate(data);
            }
          });
        });

        socket.on('groups-updated', (data: { instanceId: string }) => {
          callbacks.forEach((cb) => {
            if (cb.onGroupsUpdate) {
              cb.onGroupsUpdate(data);
            }
          });
        });

      socket.on('error', (error: { message: string }) => {
        console.error('❌ [Socket] Erro no WebSocket:', error.message);
      });
      };

      // Função para registrar listeners de conexão (apenas uma vez)
      const registerConnectionListeners = () => {
        // Remover listeners antigos
        socket.off('connect');
        socket.off('disconnect');
        socket.off('reconnect');
        socket.off('reconnect_attempt');
        socket.off('reconnect_error');
        socket.off('connect_error');

        socket.on('connect', () => {
          console.log('✅ [Socket] Conectado ao WebSocket:', socket.id);
          // Re-registrar listeners após reconexão para garantir que estão ativos
          registerEventListeners();
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ [Socket] Desconectado do WebSocket:', reason);
        });

        socket.on('reconnect', (attemptNumber) => {
          console.log(`🔄 [Socket] Reconectado após ${attemptNumber} tentativa(s)`);
          // Re-registrar listeners após reconexão
          registerEventListeners();
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`🔄 [Socket] Tentando reconectar (tentativa ${attemptNumber})...`);
        });

        socket.on('reconnect_error', (error) => {
          console.error('❌ [Socket] Erro ao tentar reconectar:', error.message);
        });

        socket.on('connect_error', (error) => {
          console.error('❌ [Socket] Erro ao conectar:', error.message);
        });
      };

      // Registrar todos os listeners
      registerEventListeners();
      registerConnectionListeners();


      // Cleanup: remover callbacks quando componente desmontar
      return () => {
        callbacks.delete(callbackObj);
        
        // Se não há mais callbacks, agendar desconexão
        if (callbacks.size === 0 && globalSocket) {
          setTimeout(() => {
            if (callbacks.size === 0 && globalSocket) {
              console.log('🔌 [Socket] Nenhum callback ativo, desconectando...');
              safeDisconnect(globalSocket);
              globalSocket = null;
              globalToken = null;
            }
          }, 2000);
        }
      };
    }
  }, [token]);

  return globalSocket;
};


import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/Layout';
import { Card } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { instanceAPI, Instance } from '../services/api';

// URL base da API externa (sempre usa a URL de produção na documentação)
const API_BASE_URL = 'https://back.clerky.com.br';

const Documentation: React.FC = () => {
  const { token } = useAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const loadInstances = async () => {
      try {
        const response = await instanceAPI.getAll();
        setInstances(response.instances);
        if (response.instances.length > 0) {
          setSelectedInstance(response.instances[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar instâncias:', error);
      }
    };

    if (token) {
      loadInstances();
    }
  }, [token]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock: React.FC<{ code: string; language?: string; id?: string }> = ({ code, language = 'bash', id }) => {
    const codeId = id || `code-${Math.random()}`;
    return (
      <div className="relative">
        <pre className="bg-gray-900 dark:bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          <code className={`language-${language}`}>{code}</code>
        </pre>
        <button
          onClick={() => copyToClipboard(code, codeId)}
          className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
          title="Copiar código"
        >
          {copiedCode === codeId ? '✓' : '📋'}
        </button>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="animate-fadeIn max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-clerky-backendText dark:text-gray-200 mb-2">
            Documentação da API Externa
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Integre sua aplicação com o Clerky usando nossa API REST. Envie mensagens, gerencie contatos e muito mais.
          </p>
        </div>

        {/* Seleção de Instância */}
        {instances.length > 0 && (
          <Card padding="lg" shadow="lg" className="mb-6">
            <label className="block text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">
              Selecione uma instância para ver o token:
            </label>
            <select
              value={selectedInstance?.id || ''}
              onChange={(e) => {
                const instance = instances.find((i) => i.id === e.target.value);
                setSelectedInstance(instance || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200"
            >
              {instances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.name} ({instance.instanceName})
                </option>
              ))}
            </select>
            {selectedInstance && selectedInstance.token && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Token da API:</p>
                    <code className="text-lg font-mono text-clerky-backendButton dark:text-blue-400">
                      {selectedInstance.token}
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedInstance.token!, 'token')}
                    className="p-2 bg-clerky-backendButton hover:bg-clerky-backendButtonHover text-white rounded transition-colors"
                    title="Copiar token"
                  >
                    {copiedCode === 'token' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Autenticação */}
        <Card padding="lg" shadow="lg" className="mb-6">
          <h2 className="text-2xl font-semibold text-clerky-backendText dark:text-gray-200 mb-4">
            🔐 Autenticação
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Todas as requisições devem incluir o token de autenticação no header <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Authorization</code>.
          </p>
          <CodeBlock
            code={`Authorization: Bearer SEU_TOKEN_AQUI`}
            language="http"
            id="auth-header"
          />
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            O token é único para cada instância e pode ser encontrado no card da instância na página de Gerenciador de Conexões.
          </p>
        </Card>

        {/* Base URL */}
        <Card padding="lg" shadow="lg" className="mb-6">
          <h2 className="text-2xl font-semibold text-clerky-backendText dark:text-gray-200 mb-4">
            🌐 URL Base
          </h2>
          <CodeBlock code={`${API_BASE_URL}/api/v1/webhook`} language="text" id="base-url" />
        </Card>

        {/* Envio de Mensagens */}
        <Card padding="lg" shadow="lg" className="mb-6">
          <h2 className="text-2xl font-semibold text-clerky-backendText dark:text-gray-200 mb-4">
            💬 Envio de Mensagens
          </h2>

          {/* Enviar Texto */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Enviar Mensagem de Texto
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /send-text</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Envia uma mensagem de texto para um contato.
            </p>
            <div className="mb-3">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Parâmetros:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">phone</code> (string, obrigatório) - Número do telefone (ex: "5511999999999")</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">text</code> (string, obrigatório) - Texto da mensagem</li>
              </ul>
            </div>
            <CodeBlock
              code={`curl -X POST ${API_BASE_URL}/api/v1/webhook/send-text \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "text": "Olá! Esta é uma mensagem de teste."
  }'`}
              language="bash"
              id="send-text"
            />
          </div>

          {/* Enviar Imagem */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Enviar Imagem
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /send-image</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Envia uma imagem com legenda opcional para um contato.
            </p>
            <div className="mb-3">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Parâmetros:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">phone</code> (string, obrigatório) - Número do telefone</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">image</code> (string, obrigatório) - URL pública da imagem</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">caption</code> (string, opcional) - Legenda da imagem</li>
              </ul>
            </div>
            <CodeBlock
              code={`curl -X POST ${API_BASE_URL}/api/v1/webhook/send-image \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "image": "https://exemplo.com/imagem.jpg",
    "caption": "Legenda da imagem (opcional)"
  }'`}
              language="bash"
              id="send-image"
            />
          </div>

          {/* Enviar Vídeo */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Enviar Vídeo
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /send-video</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Envia um vídeo com legenda opcional para um contato.
            </p>
            <div className="mb-3">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Parâmetros:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">phone</code> (string, obrigatório) - Número do telefone</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">video</code> (string, obrigatório) - URL pública do vídeo</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">caption</code> (string, opcional) - Legenda do vídeo</li>
              </ul>
            </div>
            <CodeBlock
              code={`curl -X POST ${API_BASE_URL}/api/v1/webhook/send-video \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "video": "https://exemplo.com/video.mp4",
    "caption": "Legenda do vídeo (opcional)"
  }'`}
              language="bash"
              id="send-video"
            />
          </div>

          {/* Enviar Arquivo */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Enviar Arquivo
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /send-file</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Envia um arquivo genérico (PDF, DOC, etc.) para um contato.
            </p>
            <div className="mb-3">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Parâmetros:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">phone</code> (string, obrigatório) - Número do telefone</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">file</code> (string, obrigatório) - URL pública do arquivo</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">filename</code> (string, obrigatório) - Nome do arquivo</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">mimetype</code> (string, opcional) - Tipo MIME do arquivo</li>
              </ul>
            </div>
            <CodeBlock
              code={`curl -X POST ${API_BASE_URL}/api/v1/webhook/send-file \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "file": "https://exemplo.com/arquivo.pdf",
    "filename": "documento.pdf",
    "mimetype": "application/pdf"
  }'`}
              language="bash"
              id="send-file"
            />
          </div>

          {/* Enviar Áudio */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Enviar Áudio
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /send-audio</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Envia um áudio para um contato.
            </p>
            <div className="mb-3">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Parâmetros:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">phone</code> (string, obrigatório) - Número do telefone</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">audio</code> (string, obrigatório) - URL pública do áudio</li>
              </ul>
            </div>
            <CodeBlock
              code={`curl -X POST ${API_BASE_URL}/api/v1/webhook/send-audio \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "audio": "https://exemplo.com/audio.mp3"
  }'`}
              language="bash"
              id="send-audio"
            />
          </div>
        </Card>

        {/* CRM */}
        <Card padding="lg" shadow="lg" className="mb-6">
          <h2 className="text-2xl font-semibold text-clerky-backendText dark:text-gray-200 mb-4">
            📋 Gerenciamento de CRM
          </h2>

          {/* Mover Contato */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Mover Contato entre Colunas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /move-contact</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Move um contato de uma coluna para outra no Kanban.
            </p>
            <div className="mb-3">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Parâmetros:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">phone</code> (string, obrigatório) - Número do telefone</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">columnId</code> (string, obrigatório) - ID da coluna (pode ser <strong>short_id</strong> 1-5 ou UUID)</li>
              </ul>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 ml-4">
                💡 <strong>Dica:</strong> Use o <strong>short_id</strong> (1, 2, 3, 4, 5) para facilitar. Veja as colunas disponíveis em <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">GET /columns</code>
              </p>
            </div>
            <CodeBlock
              code={`curl -X POST ${API_BASE_URL}/api/v1/webhook/move-contact \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "columnId": "4"
  }'`}
              language="bash"
              id="move-contact"
            />
          </div>

          {/* Listar Contatos */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Listar Contatos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">GET /contacts</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Retorna todos os contatos da instância.
            </p>
            <CodeBlock
              code={`curl -X GET ${API_BASE_URL}/api/v1/webhook/contacts \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json"`}
              language="bash"
              id="get-contacts"
            />
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Resposta de exemplo:</p>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`{
  "status": "success",
  "count": 2,
  "contacts": [
    {
      "id": "uuid-do-contato",
      "phone": "5511999999999",
      "name": "Nome do Contato",
      "profilePicture": "https://...",
      "columnId": "uuid-da-coluna",
      "unreadCount": 0,
      "lastMessage": "Última mensagem",
      "lastMessageAt": "2025-01-17T22:00:00.000Z"
    }
  ]
}`}
              </pre>
            </div>
          </div>

          {/* Listar Colunas */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Listar Colunas do Kanban
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">GET /columns</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Retorna todas as colunas do Kanban com seus IDs e short_ids.
            </p>
            <CodeBlock
              code={`curl -X GET ${API_BASE_URL}/api/v1/webhook/columns \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json"`}
              language="bash"
              id="get-columns"
            />
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Resposta de exemplo:</p>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`{
  "status": "success",
  "columns": [
    {
      "id": "uuid-da-coluna",
      "shortId": 1,
      "name": "Novos",
      "order": 0,
      "color": null
    },
    {
      "id": "uuid-da-coluna",
      "shortId": 2,
      "name": "Em Atendimento",
      "order": 1,
      "color": null
    },
    {
      "id": "uuid-da-coluna",
      "shortId": 3,
      "name": "Aguardando",
      "order": 2,
      "color": null
    },
    {
      "id": "uuid-da-coluna",
      "shortId": 4,
      "name": "Finalizados",
      "order": 3,
      "color": null
    },
    {
      "id": "uuid-da-coluna",
      "shortId": 5,
      "name": "Arquivados",
      "order": 4,
      "color": null
    }
  ]
}`}
              </pre>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                💡 Use o <strong>shortId</strong> (1-5) no parâmetro <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">columnId</code> para facilitar!
              </p>
            </div>
          </div>

          {/* Listar Labels */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Listar Labels (Etiquetas)
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">GET /labels</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Retorna todas as labels (etiquetas) disponíveis para categorizar contatos.
            </p>
            <CodeBlock
              code={`curl -X GET ${API_BASE_URL}/api/v1/webhook/labels \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json"`}
              language="bash"
              id="get-labels"
            />
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Resposta de exemplo:</p>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`{
  "status": "success",
  "labels": [
    {
      "id": "uuid-da-label",
      "shortId": 1,
      "name": "Urgente",
      "color": "#EF4444",
      "order": 0
    },
    {
      "id": "uuid-da-label",
      "shortId": 2,
      "name": "Importante",
      "color": "#F59E0B",
      "order": 1
    }
  ]
}`}
              </pre>
            </div>
          </div>

          {/* Adicionar Label a um Contato */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Adicionar Label a um Contato
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /add-label</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Adiciona uma label (etiqueta) a um contato para categorizá-lo.
            </p>
            <div className="mb-3">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Parâmetros:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">phone</code> (string, obrigatório) - Número do telefone</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">labelId</code> (string, obrigatório) - ID da label (pode ser <strong>short_id</strong> 1-5 ou UUID)</li>
              </ul>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 ml-4">
                💡 <strong>Dica:</strong> Use o <strong>short_id</strong> (1, 2, 3, 4, 5) para facilitar. Veja as labels disponíveis em <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">GET /labels</code>
              </p>
            </div>
            <CodeBlock
              code={`curl -X POST ${API_BASE_URL}/api/v1/webhook/add-label \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "labelId": "1"
  }'`}
              language="bash"
              id="add-label"
            />
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Resposta de exemplo:</p>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`{
  "status": "success",
  "message": "Label adicionada ao contato com sucesso",
  "data": {
    "contactId": "uuid-do-contato",
    "labelId": "uuid-da-label",
    "labelName": "Urgente"
  }
}`}
              </pre>
            </div>
          </div>

          {/* Remover Label de um Contato */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-3">
              Remover Label de um Contato
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /remove-label</code>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              Remove uma label (etiqueta) de um contato.
            </p>
            <div className="mb-3">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Parâmetros:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">phone</code> (string, obrigatório) - Número do telefone</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">labelId</code> (string, obrigatório) - ID da label (pode ser <strong>short_id</strong> 1-5 ou UUID)</li>
              </ul>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 ml-4">
                💡 <strong>Dica:</strong> Use o <strong>short_id</strong> (1, 2, 3, 4, 5) para facilitar. Veja as labels disponíveis em <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">GET /labels</code>
              </p>
            </div>
            <CodeBlock
              code={`curl -X POST ${API_BASE_URL}/api/v1/webhook/remove-label \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5511999999999",
    "labelId": "1"
  }'`}
              language="bash"
              id="remove-label"
            />
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">Resposta de exemplo:</p>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`{
  "status": "success",
  "message": "Label removida do contato com sucesso",
  "data": {
    "contactId": "uuid-do-contato",
    "labelId": "uuid-da-label",
    "labelName": "Urgente"
  }
}`}
              </pre>
            </div>
          </div>
        </Card>

        {/* Respostas e Erros */}
        <Card padding="lg" shadow="lg" className="mb-6">
          <h2 className="text-2xl font-semibold text-clerky-backendText dark:text-gray-200 mb-4">
            📤 Respostas da API
          </h2>

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
              Resposta de Sucesso
            </h3>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <pre className="text-xs text-green-700 dark:text-green-400 overflow-x-auto">
{`{
  "status": "success",
  "message": "Mensagem enviada com sucesso",
  "data": {
    "messageId": "id-da-mensagem",
    "contactId": "uuid-do-contato",
    "timestamp": "2025-01-17T22:00:00.000Z"
  }
}`}
              </pre>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
              Resposta de Erro
            </h3>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <pre className="text-xs text-red-700 dark:text-red-400 overflow-x-auto">
{`{
  "status": "error",
  "message": "Campo 'phone' é obrigatório",
  "statusCode": 400
}`}
              </pre>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
              Códigos de Status HTTP
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">200</code> - Sucesso</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">400</code> - Erro de validação (campos obrigatórios faltando)</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">401</code> - Token inválido ou não fornecido</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">404</code> - Recurso não encontrado (contato, coluna, etc.)</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">500</code> - Erro interno do servidor</li>
            </ul>
          </div>
        </Card>

        {/* Informações Importantes */}
        <Card padding="lg" shadow="lg" className="mb-6">
          <h2 className="text-2xl font-semibold text-clerky-backendText dark:text-gray-200 mb-4">
            ⚠️ Informações Importantes
          </h2>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2 ml-4">
            <li>
              <strong>Formato do Telefone:</strong> Use apenas números, incluindo código do país (ex: "5511999999999" para Brasil)
            </li>
            <li>
              <strong>URLs de Mídia:</strong> Todas as URLs de mídia (imagem, vídeo, arquivo, áudio) devem ser públicas e acessíveis
            </li>
            <li>
              <strong>Short ID das Colunas:</strong> Use os valores 1, 2, 3, 4, 5 ao invés de UUIDs longos para facilitar
            </li>
            <li>
              <strong>Short ID das Labels:</strong> Use os valores 1, 2, 3, 4, 5 ao invés de UUIDs longos para facilitar
            </li>
            <li>
              <strong>Token:</strong> O token é único por instância e permanente até a instância ser deletada
            </li>
            <li>
              <strong>Atualizações em Tempo Real:</strong> Mudanças feitas via API são refletidas automaticamente no frontend via WebSocket
            </li>
          </ul>
        </Card>

        {/* Exemplo Completo */}
        <Card padding="lg" shadow="lg" className="mb-6">
          <h2 className="text-2xl font-semibold text-clerky-backendText dark:text-gray-200 mb-4">
            📝 Exemplo Completo (JavaScript)
          </h2>
          <CodeBlock
            code={`// Exemplo de uso da API em JavaScript/Node.js

const API_BASE_URL = '${API_BASE_URL}/api/v1/webhook';
const TOKEN = 'SEU_TOKEN_AQUI';

// Enviar mensagem de texto
async function enviarTexto(phone, text) {
  const response = await fetch(\`\${API_BASE_URL}/send-text\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phone,
      text: text
    })
  });
  
  return await response.json();
}

// Mover contato para coluna "Finalizados" (short_id = 4)
async function moverParaFinalizados(phone) {
  const response = await fetch(\`\${API_BASE_URL}/move-contact\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phone,
      columnId: '4' // short_id da coluna "Finalizados"
    })
  });
  
  return await response.json();
}

// Listar colunas
async function listarColunas() {
  const response = await fetch(\`\${API_BASE_URL}/columns\`, {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${TOKEN}\`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

// Listar labels
async function listarLabels() {
  const response = await fetch(\`\${API_BASE_URL}/labels\`, {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${TOKEN}\`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

// Adicionar label a um contato (usando short_id = 1)
async function adicionarLabel(phone) {
  const response = await fetch(\`\${API_BASE_URL}/add-label\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phone,
      labelId: '1' // short_id da label "Urgente"
    })
  });
  
  return await response.json();
}

// Remover label de um contato
async function removerLabel(phone) {
  const response = await fetch(\`\${API_BASE_URL}/remove-label\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phone,
      labelId: '1' // short_id da label
    })
  });
  
  return await response.json();
}

// Uso
enviarTexto('5511999999999', 'Olá!')
  .then(result => console.log('Mensagem enviada:', result))
  .catch(error => console.error('Erro:', error));`}
            language="javascript"
            id="example-js"
          />
        </Card>
      </div>
    </AppLayout>
  );
};

export default Documentation;

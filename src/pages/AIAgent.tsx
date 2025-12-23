import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/Layout';
import { Card, Button, Modal, Input } from '../components/UI';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { aiAgentAPI, instanceAPI, Instance } from '../services/api';
import type { AIAgent, AIAgentLead } from '../services/api';

const AIAgentPage: React.FC = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [leads, setLeads] = useState<AIAgentLead[]>([]);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados do formulário
  const [agentName, setAgentName] = useState('');
  const [agentInstanceId, setAgentInstanceId] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentWaitTime, setAgentWaitTime] = useState(13);
  const [agentIsActive, setAgentIsActive] = useState(true);

  // Carregar agentes
  const loadAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await aiAgentAPI.getAll();
      setAgents(response.agents);
    } catch (error: any) {
      console.error('Erro ao carregar agentes:', error);
      alert(error.message || 'Erro ao carregar agentes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar instâncias
  const loadInstances = useCallback(async () => {
    try {
      const response = await instanceAPI.getAll();
      setInstances(response.instances);
    } catch (error: any) {
      console.error('Erro ao carregar instâncias:', error);
    }
  }, []);

  // Carregar leads
  const loadLeads = useCallback(async (instanceId?: string) => {
    try {
      const response = await aiAgentAPI.getLeads(instanceId);
      setLeads(response.leads);
    } catch (error: any) {
      console.error('Erro ao carregar leads:', error);
      alert(error.message || 'Erro ao carregar leads');
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadAgents();
      loadInstances();
    }
  }, [token, loadAgents, loadInstances]);

  // Selecionar agente
  const handleSelectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setAgentName(agent.name);
    setAgentInstanceId(agent.instanceId);
    setAgentPrompt(agent.prompt);
    setAgentWaitTime(agent.waitTime);
    setAgentIsActive(agent.isActive);
  };

  // Criar novo agente
  const handleCreateAgent = async () => {
    if (!agentName.trim() || !agentInstanceId || !agentPrompt.trim()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (agentPrompt.length > 100000) {
      alert('O prompt não pode exceder 100.000 caracteres');
      return;
    }

    try {
      setIsSaving(true);
      const response = await aiAgentAPI.create({
        name: agentName.trim(),
        instanceId: agentInstanceId,
        prompt: agentPrompt,
        waitTime: agentWaitTime,
        isActive: agentIsActive,
      });
      setAgents([response.agent, ...agents]);
      setSelectedAgent(response.agent);
      alert('Agente criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar agente:', error);
      alert(error.message || 'Erro ao criar agente');
    } finally {
      setIsSaving(false);
    }
  };

  // Atualizar agente
  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;

    if (!agentName.trim() || !agentPrompt.trim()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (agentPrompt.length > 100000) {
      alert('O prompt não pode exceder 100.000 caracteres');
      return;
    }

    try {
      setIsSaving(true);
      const response = await aiAgentAPI.update(selectedAgent.id, {
        name: agentName.trim(),
        prompt: agentPrompt,
        waitTime: agentWaitTime,
        isActive: agentIsActive,
      });
      setAgents(agents.map((a) => (a.id === response.agent.id ? response.agent : a)));
      setSelectedAgent(response.agent);
      alert('Agente atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar agente:', error);
      alert(error.message || 'Erro ao atualizar agente');
    } finally {
      setIsSaving(false);
    }
  };

  // Deletar agente
  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;

    if (!window.confirm('Tem certeza que deseja deletar este agente?')) {
      return;
    }

    try {
      await aiAgentAPI.delete(selectedAgent.id);
      setAgents(agents.filter((a) => a.id !== selectedAgent.id));
      setSelectedAgent(null);
      alert('Agente deletado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar agente:', error);
      alert(error.message || 'Erro ao deletar agente');
    }
  };

  // Exportar leads
  const handleExportLeads = (format: 'csv' | 'json') => {
    if (leads.length === 0) {
      alert('Nenhum lead para exportar');
      return;
    }

    if (format === 'csv') {
      const headers = ['Telefone', 'Nome', 'Interesse', 'Interesse Detectado', 'Última Interação', 'Total Mensagens'];
      const rows = leads.map((lead) => [
        lead.phone,
        lead.name || '',
        lead.interest || '',
        lead.detectedInterest ? 'Sim' : 'Não',
        lead.lastInteraction || '',
        lead.history.length.toString(),
      ]);

      const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      const jsonContent = JSON.stringify(leads, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leads_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }
  };

  // Visualizar leads
  const handleViewLeads = async () => {
    await loadLeads(selectedAgent?.instanceId);
    setShowLeadsModal(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-clerky-backendText dark:text-gray-200">
            Agente de IA
          </h1>
          <div className="flex gap-2">
            {selectedAgent && (
              <>
                <Button variant="outline" onClick={handleViewLeads}>
                  Ver Leads ({leads.length})
                </Button>
                <Button variant="outline" onClick={handleDeleteAgent}>
                  Deletar
                </Button>
              </>
            )}
            <Button
              onClick={() => {
                setSelectedAgent(null);
                setAgentName('');
                setAgentInstanceId('');
                setAgentPrompt('');
                setAgentWaitTime(13);
                setAgentIsActive(true);
              }}
            >
              Novo Agente
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Agentes */}
          <div className="lg:col-span-1">
            <Card padding="md">
              <h2 className="text-lg font-semibold mb-4 text-clerky-backendText dark:text-gray-200">
                Agentes
              </h2>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAgent?.id === agent.id
                        ? 'border-clerky-backendButton bg-clerky-backendButton/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-clerky-backendButton/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-clerky-backendText dark:text-gray-200">
                        {agent.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          agent.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {agent.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {instances.find((i) => i.id === agent.instanceId)?.name || agent.instanceId}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Wait: {agent.waitTime}s
                    </p>
                  </div>
                ))}
                {agents.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Nenhum agente criado ainda</p>
                )}
              </div>
            </Card>
          </div>

          {/* Configuração do Agente */}
          <div className="lg:col-span-2">
            <Card padding="md">
              <h2 className="text-lg font-semibold mb-4 text-clerky-backendText dark:text-gray-200">
                {selectedAgent ? 'Editar Agente' : 'Novo Agente'}
              </h2>

              <div className="space-y-4">
                <Input
                  label="Nome do Agente"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Ex: Atendimento Automático"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instância WhatsApp *
                  </label>
                  <select
                    value={agentInstanceId}
                    onChange={(e) => setAgentInstanceId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200"
                    disabled={!!selectedAgent}
                  >
                    <option value="">Selecione uma instância</option>
                    {instances.map((instance) => (
                      <option key={instance.id} value={instance.id}>
                        {instance.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tempo de Espera (segundos) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={agentWaitTime}
                    onChange={(e) => setAgentWaitTime(parseInt(e.target.value) || 13)}
                    placeholder="13"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tempo para agrupar mensagens consecutivas antes de processar
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt do Agente * ({agentPrompt.length}/100.000 caracteres)
                  </label>
                  <textarea
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    placeholder="Digite o prompt do agente aqui..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 min-h-[300px] font-mono text-sm"
                    maxLength={100000}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Este prompt define o comportamento do agente. Use até 100.000 caracteres.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    📡 URL de Callback para Transcrição de Áudio
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    Use esta URL para receber transcrições de áudio:
                  </p>
                  <code className="block bg-white dark:bg-gray-800 p-2 rounded text-xs break-all text-blue-900 dark:text-blue-200">
                    https://api.clerky.com.br/api/ai-agent/transcription-callback
                  </code>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Payload esperado: {'{'} "userId": "...", "contactPhone": "...", "instanceId": "...", "messageId": "...", "transcription": "..." {'}'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={agentIsActive}
                    onChange={(e) => setAgentIsActive(e.target.checked)}
                    className="w-4 h-4 text-clerky-backendButton border-gray-300 rounded focus:ring-clerky-backendButton"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                    Agente ativo
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={selectedAgent ? handleUpdateAgent : handleCreateAgent}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Salvando...' : selectedAgent ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Modal de Leads */}
        <Modal
          isOpen={showLeadsModal}
          onClose={() => setShowLeadsModal(false)}
          title="Leads do Agente"
        >
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleExportLeads('csv')}>
                Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => handleExportLeads('json')}>
                Exportar JSON
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Telefone</th>
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-left">Interesse</th>
                    <th className="px-4 py-2 text-left">Última Interação</th>
                    <th className="px-4 py-2 text-left">Mensagens</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2">{lead.phone}</td>
                      <td className="px-4 py-2">{lead.name || '-'}</td>
                      <td className="px-4 py-2">
                        {lead.detectedInterest ? (
                          <span className="text-green-600 dark:text-green-400">Sim</span>
                        ) : (
                          <span className="text-gray-400">Não</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {lead.lastInteraction
                          ? new Date(lead.lastInteraction).toLocaleString('pt-BR')
                          : '-'}
                      </td>
                      <td className="px-4 py-2">{lead.history.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhum lead encontrado</p>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default AIAgentPage;

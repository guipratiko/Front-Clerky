import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/Layout';
import { Card, Button, Modal, Input } from '../components/UI';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { aiAgentAPI, instanceAPI, Instance } from '../services/api';
import type { AIAgent, AIAgentLead } from '../services/api';
import type { AssistedConfig } from '../types/aiAgent';
import AssistedForm from '../components/AIAgent/AssistedForm';
import { getErrorMessage, logError } from '../utils/errorHandler';

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
  const [agentTranscribeAudio, setAgentTranscribeAudio] = useState(true);
  const [agentType, setAgentType] = useState<'manual' | 'assisted'>('manual');
  const [assistedConfig, setAssistedConfig] = useState<AssistedConfig>({});

  // Carregar agentes
  const loadAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await aiAgentAPI.getAll();
      setAgents(response.agents);
    } catch (error: unknown) {
      logError('AIAgent.loadAgents', error);
      const errorMsg = getErrorMessage(error, t('aiAgent.error.loadAgents'));
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (error: unknown) {
      logError('AIAgent.loadLeads', error);
      const errorMsg = getErrorMessage(error, t('aiAgent.error.loadLeads'));
      alert(errorMsg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token) {
      loadAgents();
      loadInstances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Remover loadAgents e loadInstances das dependências para evitar recarregamentos

  // Selecionar agente
  const handleSelectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setAgentName(agent.name);
    setAgentInstanceId(agent.instanceId);
    setAgentPrompt(agent.prompt);
    setAgentWaitTime(agent.waitTime);
    setAgentIsActive(agent.isActive);
    setAgentTranscribeAudio(agent.transcribeAudio !== undefined ? agent.transcribeAudio : true);
    setAgentType(agent.agentType || 'manual');
    setAssistedConfig(agent.assistedConfig || {});
  };

  // Criar novo agente
  const handleCreateAgent = async () => {
    if (!agentName.trim() || !agentInstanceId) {
      alert(t('aiAgent.validation.fillRequired'));
      return;
    }

    if (agentType === 'manual' && !agentPrompt.trim()) {
      alert(t('aiAgent.validation.fillPrompt'));
      return;
    }

    if (agentPrompt && agentPrompt.length > 100000) {
      alert(t('aiAgent.validation.promptMaxLength'));
      return;
    }

    try {
      setIsSaving(true);
      const response = await aiAgentAPI.create({
        name: agentName.trim(),
        instanceId: agentInstanceId,
        prompt: agentType === 'manual' ? agentPrompt : undefined,
        waitTime: agentWaitTime,
        isActive: agentIsActive,
        transcribeAudio: agentTranscribeAudio,
        agentType,
        assistedConfig: agentType === 'assisted' ? assistedConfig : undefined,
      });
      setAgents([response.agent, ...agents]);
      setSelectedAgent(response.agent);
      alert(t('aiAgent.success.createAgent'));
    } catch (error: unknown) {
      logError('AIAgent.createAgent', error);
      const errorMsg = getErrorMessage(error, t('aiAgent.error.createAgent'));
      alert(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Atualizar agente
  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;

    if (!agentName.trim()) {
      alert(t('aiAgent.validation.fillRequired'));
      return;
    }

    if (agentType === 'manual' && !agentPrompt.trim()) {
      alert(t('aiAgent.validation.fillPrompt'));
      return;
    }

    if (agentPrompt && agentPrompt.length > 100000) {
      alert(t('aiAgent.validation.promptMaxLength'));
      return;
    }

    try {
      setIsSaving(true);
      const response = await aiAgentAPI.update(selectedAgent.id, {
        name: agentName.trim(),
        prompt: agentType === 'manual' ? agentPrompt : undefined,
        waitTime: agentWaitTime,
        isActive: agentIsActive,
        transcribeAudio: agentTranscribeAudio,
        agentType,
        assistedConfig: agentType === 'assisted' ? assistedConfig : undefined,
      });
      setAgents(agents.map((a) => (a.id === response.agent.id ? response.agent : a)));
      setSelectedAgent(response.agent);
      alert(t('aiAgent.success.updateAgent'));
    } catch (error: unknown) {
      logError('AIAgent.updateAgent', error);
      const errorMsg = getErrorMessage(error, t('aiAgent.error.updateAgent'));
      alert(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Deletar agente
  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;

    if (!window.confirm(t('aiAgent.confirm.delete'))) {
      return;
    }

    try {
      await aiAgentAPI.delete(selectedAgent.id);
      setAgents(agents.filter((a) => a.id !== selectedAgent.id));
      setSelectedAgent(null);
      alert(t('aiAgent.success.deleteAgent'));
    } catch (error: unknown) {
      logError('AIAgent.deleteAgent', error);
      const errorMsg = getErrorMessage(error, t('aiAgent.error.deleteAgent'));
      alert(errorMsg);
    }
  };

  // Exportar leads
  const handleExportLeads = (format: 'csv' | 'json') => {
    if (leads.length === 0) {
      alert(t('aiAgent.export.noLeads'));
      return;
    }

    if (format === 'csv') {
      const headers = [t('aiAgent.phone'), t('aiAgent.name'), t('aiAgent.interest'), t('aiAgent.interest'), t('aiAgent.lastInteraction'), t('aiAgent.messages')];
      const rows = leads.map((lead) => [
        lead.phone,
        lead.name || '',
        lead.interest || '',
        lead.detectedInterest ? t('aiAgent.yes') : t('aiAgent.no'),
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
          <p className="text-gray-500">{t('aiAgent.loading')}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-clerky-backendText dark:text-gray-200">
            {t('aiAgent.title')}
          </h1>
          <div className="flex gap-2">
            {selectedAgent && (
              <>
                <Button variant="outline" onClick={handleViewLeads}>
                  {t('aiAgent.viewLeads')} ({leads.length})
                </Button>
                <Button variant="outline" onClick={handleDeleteAgent}>
                  {t('aiAgent.delete')}
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
                setAgentTranscribeAudio(true);
                setAgentType('manual');
                setAssistedConfig({});
              }}
            >
              {t('aiAgent.newAgent')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Agentes */}
          <div className="lg:col-span-1">
            <Card padding="md">
              <h2 className="text-lg font-semibold mb-4 text-clerky-backendText dark:text-gray-200">
                {t('aiAgent.agents')}
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
                        {agent.isActive ? t('aiAgent.active') : t('aiAgent.inactive')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {instances.find((i) => i.id === agent.instanceId)?.name || agent.instanceId}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {t('aiAgent.waitTime', { time: agent.waitTime.toString() })}
                    </p>
                  </div>
                ))}
                {agents.length === 0 && (
                  <p className="text-gray-500 text-center py-4">{t('aiAgent.noAgents')}</p>
                )}
              </div>
            </Card>
          </div>

          {/* Configuração do Agente */}
          <div className="lg:col-span-2">
            <Card padding="md">
              <h2 className="text-lg font-semibold mb-4 text-clerky-backendText dark:text-gray-200">
                {selectedAgent ? t('aiAgent.editAgent') : t('aiAgent.createAgent')}
              </h2>

              <div className="space-y-4">
                <Input
                  label={t('aiAgent.agentName')}
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder={t('aiAgent.agentNamePlaceholder')}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('aiAgent.whatsappInstance')} *
                  </label>
                  <select
                    value={agentInstanceId}
                    onChange={(e) => setAgentInstanceId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200"
                    disabled={!!selectedAgent}
                  >
                    <option value="">{t('aiAgent.selectInstance')}</option>
                    {instances.map((instance) => (
                      <option key={instance.id} value={instance.id}>
                        {instance.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('aiAgent.waitTimeLabel')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={agentWaitTime}
                    onChange={(e) => setAgentWaitTime(parseInt(e.target.value) || 13)}
                    placeholder="13"
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 text-center"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('aiAgent.waitTimeHelper')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('aiAgent.agentModel')} *
                  </label>
                  <select
                    value={agentType}
                    onChange={(e) => {
                      setAgentType(e.target.value as 'manual' | 'assisted');
                      if (e.target.value === 'manual') {
                        setAssistedConfig({});
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200"
                  >
                    <option value="manual">{t('aiAgent.modelManual')}</option>
                    <option value="assisted">{t('aiAgent.modelAssisted')}</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('aiAgent.modelHelper')}
                  </p>
                </div>

                {agentType === 'manual' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('aiAgent.promptLabel')} * ({agentPrompt.length.toLocaleString()}/100,000 {t('aiAgent.characters')})
                    </label>
                    <textarea
                      value={agentPrompt}
                      onChange={(e) => setAgentPrompt(e.target.value)}
                      placeholder={t('aiAgent.promptPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 min-h-[300px] font-mono text-sm"
                      maxLength={100000}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('aiAgent.promptHelper')}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('aiAgent.assistedFormTitle')}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      {t('aiAgent.assistedFormHelper')}
                    </p>
                    <AssistedForm key="assisted-form" config={assistedConfig} onChange={setAssistedConfig} />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={agentIsActive}
                    onChange={(e) => setAgentIsActive(e.target.checked)}
                    className="w-4 h-4 text-clerky-backendButton border-gray-300 rounded focus:ring-clerky-backendButton"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                    {t('aiAgent.isActive')}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="transcribeAudio"
                    checked={agentTranscribeAudio}
                    onChange={(e) => setAgentTranscribeAudio(e.target.checked)}
                    className="w-4 h-4 text-clerky-backendButton border-gray-300 rounded focus:ring-clerky-backendButton"
                  />
                  <label htmlFor="transcribeAudio" className="text-sm text-gray-700 dark:text-gray-300">
                    {t('aiAgent.transcribeAudio')}
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                  {t('aiAgent.transcribeAudioHelper')}
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={selectedAgent ? handleUpdateAgent : handleCreateAgent}
                    disabled={isSaving}
                  >
                    {isSaving ? t('aiAgent.saving') : selectedAgent ? t('aiAgent.update') : t('aiAgent.create')}
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
          title={t('aiAgent.leadsTitle')}
        >
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleExportLeads('csv')}>
                {t('aiAgent.exportCSV')}
              </Button>
              <Button variant="outline" onClick={() => handleExportLeads('json')}>
                {t('aiAgent.exportJSON')}
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">{t('aiAgent.phone')}</th>
                    <th className="px-4 py-2 text-left">{t('aiAgent.name')}</th>
                    <th className="px-4 py-2 text-left">{t('aiAgent.interest')}</th>
                    <th className="px-4 py-2 text-left">{t('aiAgent.lastInteraction')}</th>
                    <th className="px-4 py-2 text-left">{t('aiAgent.messages')}</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2">{lead.phone}</td>
                      <td className="px-4 py-2">{lead.name || '-'}</td>
                      <td className="px-4 py-2">
                        {lead.detectedInterest ? (
                          <span className="text-green-600 dark:text-green-400">{t('aiAgent.yes')}</span>
                        ) : (
                          <span className="text-gray-400">{t('aiAgent.no')}</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {lead.lastInteraction
                          ? new Date(lead.lastInteraction).toLocaleString()
                          : '-'}
                      </td>
                      <td className="px-4 py-2">{lead.history.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length === 0 && (
                <p className="text-center text-gray-500 py-4">{t('aiAgent.noLeads')}</p>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default AIAgentPage;

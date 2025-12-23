import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/Layout';
import { Card, Button, Modal } from '../components/UI';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { instanceAPI, Instance, UpdateInstanceSettingsData } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { getErrorMessage, logError } from '../utils/errorHandler';

const Instances: React.FC = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formulário de criação
  const [formData, setFormData] = useState({
    name: '',
    rejectCall: false,
    groupsIgnore: false,
    alwaysOnline: false,
    readMessages: false,
    readStatus: false,
  });

  // Formulário de atualização de settings
  const [settingsData, setSettingsData] = useState<UpdateInstanceSettingsData>({
    rejectCall: false,
    groupsIgnore: false,
    alwaysOnline: false,
    readMessages: false,
    readStatus: false,
    syncFullHistory: true,
  });

  // Callback para atualizar status via WebSocket
  const handleStatusUpdate = useCallback((data: { instanceId: string; status: string }) => {
    setInstances((prev) =>
      prev.map((inst) =>
        inst.id === data.instanceId ? { ...inst, status: data.status as Instance['status'] } : inst
      )
    );

    // Fechar modal de QR Code se a instância conectou
    if (data.status === 'connected') {
      setSelectedInstance((currentInstance) => {
        // Verificar se a instância que conectou é a que está no modal
        if (currentInstance?.id === data.instanceId) {
          setShowQRModal(false);
          setSuccessMessage(t('instances.connectedSuccess'));
          setTimeout(() => setSuccessMessage(null), 3000);
          return null;
        }
        return currentInstance;
      });
    }
  }, [t]);

  // Conectar ao WebSocket
  useSocket(token, handleStatusUpdate);

  const loadInstances = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await instanceAPI.getAll();
      setInstances(response.instances);
      setError(null);
    } catch (error: unknown) {
      logError('Instances.loadInstances', error);
      const errorMsg = getErrorMessage(error, t('error.getInstancesFailed'));
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadInstances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remover loadInstances das dependências para evitar recarregamentos

  const handleCreateInstance = async () => {
    try {
      setIsCreating(true);
      setError(null);
      const response = await instanceAPI.create(formData);
      setInstances([...instances, response.instance]);
      setShowCreateModal(false);
      setSuccessMessage(t('instances.createSuccess'));
      setFormData({
        name: '',
        rejectCall: false,
        groupsIgnore: false,
        alwaysOnline: false,
        readMessages: false,
        readStatus: false,
      });

      // Se tiver QR code, mostrar modal
      if (response.instance.qrcodeBase64) {
        setSelectedInstance(response.instance);
        setShowQRModal(true);
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      logError('Instances.createInstance', error);
      const errorMsg = getErrorMessage(error, t('error.createInstanceFailed'));
      setError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedInstance) return;

    try {
      setIsUpdating(true);
      setError(null);
      await instanceAPI.updateSettings(selectedInstance.id, settingsData);
      await loadInstances(); // Recarregar lista
      setShowSettingsModal(false);
      setSuccessMessage(t('instances.settingsUpdated'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      logError('Instances.updateSettings', error);
      const errorMsg = getErrorMessage(error, t('error.updateSettingsFailed'));
      setError(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteInstance = async (id: string) => {
    if (!window.confirm(t('instances.deleteConfirm'))) {
      return;
    }

    try {
      await instanceAPI.delete(id);
      setInstances(instances.filter((inst) => inst.id !== id));
      setSuccessMessage(t('instances.deleteSuccess'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      logError('Instances.deleteInstance', error);
      const errorMsg = getErrorMessage(error, t('error.deleteInstanceFailed'));
      setError(errorMsg);
    }
  };


  const handleOpenSettings = (instance: Instance) => {
    setSelectedInstance(instance);
    setSettingsData({
      rejectCall: instance.settings.rejectCall,
      groupsIgnore: instance.settings.groupsIgnore,
      alwaysOnline: instance.settings.alwaysOnline,
      readMessages: instance.settings.readMessages,
      readStatus: instance.settings.readStatus,
      syncFullHistory: instance.settings.syncFullHistory,
    });
    setShowSettingsModal(true);
  };

  const getStatusColor = (status: Instance['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusText = (status: Instance['status']) => {
    switch (status) {
      case 'created':
        return t('instances.created');
      case 'connecting':
        return t('instances.connecting');
      case 'connected':
        return t('instances.connected');
      case 'disconnected':
        return t('instances.disconnected');
      case 'error':
        return t('instances.error');
      default:
        return status;
    }
  };

  return (
    <AppLayout>
      <div className="animate-fadeIn max-w-7xl mx-auto">
        <div className="flex items-center justify-end mb-6">
          <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)}>
            {t('instances.create')}
          </Button>
        </div>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <Card padding="lg" shadow="lg">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clerky-backendButton mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
            </div>
          </Card>
        ) : instances.length === 0 ? (
          <Card padding="lg" shadow="lg">
            <div className="text-center py-12">
              <p className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
                {t('instances.noInstances')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('instances.noInstancesDescription')}
              </p>
              <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)}>
                {t('instances.create')}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map((instance) => (
              <Card key={instance.id} padding="lg" shadow="lg" className="relative">
                <div className="mb-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      instance.status
                    )}`}
                  >
                    {getStatusText(instance.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Name:</span> {instance.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Internal Name:</span> {instance.instanceName}
                  </div>
                  {instance.token && (
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Token API:</span>
                        <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-700 truncate">
                          {instance.token}
                        </code>
                        <button
                          onClick={(e) => {
                            navigator.clipboard.writeText(instance.token || '');
                            // Mostrar feedback visual
                            const btn = e.currentTarget;
                            const originalHTML = btn.innerHTML;
                            btn.innerHTML = '✓';
                            btn.classList.add('text-green-500');
                            setTimeout(() => {
                              btn.innerHTML = originalHTML;
                              btn.classList.remove('text-green-500');
                            }, 2000);
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          title="Copiar token"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {instance.qrcodeBase64 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInstance(instance);
                        setShowQRModal(true);
                      }}
                    >
                      {t('instances.qrcode')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenSettings(instance)}
                  >
                    {t('instances.settings')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteInstance(instance.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {t('instances.delete')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Criação */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={t('instances.createNew')}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="instance-name" className="block text-sm font-medium text-clerky-backendText dark:text-gray-200 mb-2">
                {t('instances.instanceName')}
              </label>
              <input
                id="instance-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('instances.instanceNamePlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200"
                required
                minLength={3}
                maxLength={50}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('instances.instanceNameHelp')}
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rejectCall}
                  onChange={(e) => setFormData({ ...formData, rejectCall: e.target.checked })}
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.rejectCall')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.groupsIgnore}
                  onChange={(e) => setFormData({ ...formData, groupsIgnore: e.target.checked })}
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.groupsIgnore')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.alwaysOnline}
                  onChange={(e) => setFormData({ ...formData, alwaysOnline: e.target.checked })}
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.alwaysOnline')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.readMessages}
                  onChange={(e) => setFormData({ ...formData, readMessages: e.target.checked })}
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.readMessages')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.readStatus}
                  onChange={(e) => setFormData({ ...formData, readStatus: e.target.checked })}
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.readStatus')}
                </span>
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                {t('instances.cancel')}
              </Button>
              <Button variant="primary" onClick={handleCreateInstance} isLoading={isCreating}>
                {isCreating ? t('instances.creating') : t('instances.createButton')}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de QR Code */}
        <Modal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          title={t('instances.qrcode')}
          size="sm"
          showCloseButton={true}
        >
          {selectedInstance?.qrcodeBase64 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                {t('instances.scanQRCode')}
              </p>
              <div className="flex justify-center">
                <img
                  src={selectedInstance.qrcodeBase64}
                  alt="QR Code"
                  className="max-w-full h-auto rounded-lg border-2 border-gray-200 dark:border-gray-700"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {t('instances.qrCodeAutoClose')}
              </p>
            </div>
          )}
        </Modal>

        {/* Modal de Settings */}
        <Modal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title={t('instances.updateSettings')}
          size="md"
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsData.rejectCall || false}
                  onChange={(e) =>
                    setSettingsData({ ...settingsData, rejectCall: e.target.checked })
                  }
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.rejectCall')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsData.groupsIgnore || false}
                  onChange={(e) =>
                    setSettingsData({ ...settingsData, groupsIgnore: e.target.checked })
                  }
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.groupsIgnore')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsData.alwaysOnline || false}
                  onChange={(e) =>
                    setSettingsData({ ...settingsData, alwaysOnline: e.target.checked })
                  }
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.alwaysOnline')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsData.readMessages || false}
                  onChange={(e) =>
                    setSettingsData({ ...settingsData, readMessages: e.target.checked })
                  }
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.readMessages')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsData.readStatus || false}
                  onChange={(e) =>
                    setSettingsData({ ...settingsData, readStatus: e.target.checked })
                  }
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.readStatus')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsData.syncFullHistory || false}
                  onChange={(e) =>
                    setSettingsData({ ...settingsData, syncFullHistory: e.target.checked })
                  }
                  className="w-5 h-5 text-clerky-backendButton rounded focus:ring-clerky-backendButton"
                />
                <span className="text-clerky-backendText dark:text-gray-200">
                  {t('instances.syncFullHistory')}
                </span>
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                {t('instances.cancel')}
              </Button>
              <Button variant="primary" onClick={handleUpdateSettings} isLoading={isUpdating}>
                {isUpdating ? t('instances.updating') : t('instances.updateButton')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Instances;

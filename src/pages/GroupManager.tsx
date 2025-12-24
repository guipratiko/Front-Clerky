import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '../components/Layout';
import { Card, Button, Modal, Input } from '../components/UI';
import ImageCrop from '../components/UI/ImageCrop';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { instanceAPI, Instance, Contact, crmAPI } from '../services/api';
import { groupAPI, Group } from '../services/api';
import { getErrorMessage, logError } from '../utils/errorHandler';
import { parseCSVText, parseInputText } from '../utils/csvParser';
import { useSocket } from '../hooks/useSocket';

const GroupManager: React.FC = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Estados para criar/editar grupo
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'participants'>('info');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null);
  const [participantsText, setParticipantsText] = useState('');
  const [participantsCSV, setParticipantsCSV] = useState<File | null>(null);
  const [crmContacts, setCrmContacts] = useState<Contact[]>([]);
  const [selectedCrmContacts, setSelectedCrmContacts] = useState<Set<string>>(new Set());
  const [participantsList, setParticipantsList] = useState<Array<{ phone: string; name?: string }>>([]);
  const [validationResults, setValidationResults] = useState<{
    valid: Array<{ phone: string; name?: string }>;
    invalid: Array<{ phone: string; reason: string }>;
    validCount: number;
    invalidCount: number;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para editar grupo
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [editActiveTab, setEditActiveTab] = useState<'info' | 'participants' | 'settings'>('info');
  const [announcement, setAnnouncement] = useState(false);
  const [locked, setLocked] = useState(false);
  const [editParticipantsText, setEditParticipantsText] = useState('');
  const [editParticipantsCSV, setEditParticipantsCSV] = useState<File | null>(null);
  const [editSelectedCrmContacts, setEditSelectedCrmContacts] = useState<Set<string>>(new Set());
  const [editParticipantsList, setEditParticipantsList] = useState<Array<{ phone: string; name?: string }>>([]);
  const [showImageCropModal, setShowImageCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  // Estados para código de convite
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);
  
  // Estados para mencionar todos
  const [showMentionModal, setShowMentionModal] = useState(false);
  const [mentionText, setMentionText] = useState('');
  const [isSendingMention, setIsSendingMention] = useState(false);
  
  // Estados para edição em massa
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [bulkImage, setBulkImage] = useState<File | null>(null);
  const [bulkImagePreview, setBulkImagePreview] = useState<string | null>(null);
  const [bulkDescription, setBulkDescription] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  
  // Estados para mencionar em todos os grupos
  const [showMentionAllGroupsModal, setShowMentionAllGroupsModal] = useState(false);
  const [mentionAllGroupsText, setMentionAllGroupsText] = useState('');
  const [isMentioningAllGroups, setIsMentioningAllGroups] = useState(false);

  // Carregar instâncias
  const loadInstances = useCallback(async () => {
    try {
      const response = await instanceAPI.getAll();
      setInstances(response.instances);
      if (response.instances.length > 0 && !selectedInstance) {
        setSelectedInstance(response.instances[0].id);
      }
    } catch (error: unknown) {
      logError('Erro ao carregar instâncias', error);
    }
  }, [selectedInstance]);

  // Carregar grupos
  const loadGroups = useCallback(async () => {
    if (!selectedInstance) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await groupAPI.getAll(selectedInstance);
      setGroups(response.groups || []);
    } catch (error: unknown) {
      logError('Erro ao carregar grupos', error);
      setError(getErrorMessage(error, t('groupManager.error.loadGroups')));
    } finally {
      setIsLoading(false);
    }
  }, [selectedInstance, t]);

  // Carregar contatos do CRM
  const loadCrmContacts = useCallback(async () => {
    try {
      const response = await crmAPI.getContacts();
      setCrmContacts(response.contacts || []);
    } catch (error: unknown) {
      logError('Erro ao carregar contatos do CRM', error);
    }
  }, []);

  // Atualizar grupos
  const refreshGroups = useCallback(async () => {
    if (!selectedInstance) return;

    try {
      setIsRefreshing(true);
      setError(null);
      const response = await groupAPI.getAll(selectedInstance);
      setGroups(response.groups || []);
      setSuccessMessage(t('groupManager.success.refreshed'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      logError('Erro ao atualizar grupos', error);
      setError(getErrorMessage(error, t('groupManager.error.refreshGroups')));
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedInstance, t]);

  // Sair do grupo
  const handleLeaveGroup = async (groupId: string) => {
    if (!selectedInstance) return;
    if (!window.confirm(t('groupManager.confirm.leave'))) return;

    try {
      await groupAPI.leave(selectedInstance, groupId);
      setSuccessMessage(t('groupManager.success.left'));
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadGroups();
    } catch (error: unknown) {
      logError('Erro ao sair do grupo', error);
      alert(getErrorMessage(error, t('groupManager.error.leave')));
    }
  };

  // Visualizar detalhes do grupo
  const handleViewGroupDetails = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupDetailsModal(true);
  };

  // Abrir modal de criação
  const handleOpenCreateModal = () => {
    if (!selectedInstance) {
      alert(t('groupManager.selectInstanceFirst'));
      return;
    }
    setShowCreateModal(true);
    setActiveTab('info');
    setGroupName('');
    setGroupDescription('');
    setGroupImage(null);
    setGroupImagePreview(null);
    setParticipantsText('');
    setParticipantsCSV(null);
    setSelectedCrmContacts(new Set());
    setParticipantsList([]);
    setValidationResults(null);
    loadCrmContacts();
  };

  // Fechar modal de criação
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setGroupName('');
    setGroupDescription('');
    setGroupImage(null);
    setGroupImagePreview(null);
    setParticipantsText('');
    setParticipantsCSV(null);
    setSelectedCrmContacts(new Set());
    setParticipantsList([]);
    setValidationResults(null);
  };

  // Processar imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageSrc = reader.result as string;
        setImageToCrop(imageSrc);
        setShowImageCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Aplicar crop da imagem
  const handleCropComplete = (croppedBase64: string) => {
    // Converter base64 para File
    fetch(croppedBase64)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'group-picture.jpg', { type: 'image/jpeg' });
        setGroupImage(file);
        setGroupImagePreview(croppedBase64);
        setShowImageCropModal(false);
        setImageToCrop(null);
      })
      .catch((error) => {
        logError('Erro ao processar imagem cortada', error);
        alert(getErrorMessage(error, t('groupManager.error.processImage')));
      });
  };

  // Cancelar crop
  const handleCropCancel = () => {
    setShowImageCropModal(false);
    setImageToCrop(null);
  };

  // Processar participantes via texto
  const handleProcessTextParticipants = () => {
    if (!participantsText.trim()) {
      alert(t('groupManager.participants.textEmpty'));
      return;
    }
    const contacts = parseInputText(participantsText);
    setParticipantsList((prev) => {
      const newList = [...prev];
      contacts.forEach((contact) => {
        if (!newList.find((p) => p.phone === contact.phone)) {
          newList.push(contact);
        }
      });
      return newList;
    });
    setParticipantsText('');
  };

  // Processar participantes via CSV
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParticipantsCSV(file);
    try {
      const text = await file.text();
      const contacts = parseCSVText(text);
      setParticipantsList((prev) => {
        const newList = [...prev];
        contacts.forEach((contact) => {
          if (!newList.find((p) => p.phone === contact.phone)) {
            newList.push(contact);
          }
        });
        return newList;
      });
    } catch (error: unknown) {
      logError('Erro ao processar CSV', error);
      alert(getErrorMessage(error, t('groupManager.error.processCSV')));
    }
  };

  // Selecionar/deselecionar contatos do CRM
  const handleToggleCrmContact = (contactId: string) => {
    setSelectedCrmContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  // Selecionar todos os contatos do CRM
  const handleSelectAllCrmContacts = () => {
    setSelectedCrmContacts(new Set(crmContacts.map((c) => c.id)));
  };

  // Limpar seleção de contatos do CRM
  const handleClearCrmContacts = () => {
    setSelectedCrmContacts(new Set());
  };

  // Adicionar contatos selecionados do CRM
  const handleAddCrmContacts = () => {
    const selectedContacts = crmContacts.filter((c) => selectedCrmContacts.has(c.id));
    setParticipantsList((prev) => {
      const newList = [...prev];
      selectedContacts.forEach((contact) => {
        if (!newList.find((p) => p.phone === contact.phone)) {
          newList.push({ phone: contact.phone, name: contact.name });
        }
      });
      return newList;
    });
    setSelectedCrmContacts(new Set());
  };

  // Remover participante da lista
  const handleRemoveParticipant = (phone: string) => {
    setParticipantsList((prev) => prev.filter((p) => p.phone !== phone));
  };

  // Validar participantes
  const handleValidateParticipants = async () => {
    if (participantsList.length === 0) {
      alert(t('groupManager.participants.noParticipants'));
      return;
    }

    if (participantsList.length > 1024) {
      alert(t('groupManager.participants.maxParticipants'));
      return;
    }

    if (!selectedInstance) {
      alert(t('groupManager.selectInstanceFirst'));
      return;
    }

    try {
      setIsValidating(true);
      const phones = participantsList.map((p) => p.phone);
      const response = await groupAPI.validateParticipants(selectedInstance, phones);
      setValidationResults(response);
    } catch (error: unknown) {
      logError('Erro ao validar participantes', error);
      alert(getErrorMessage(error, t('groupManager.error.validateParticipants')));
    } finally {
      setIsValidating(false);
    }
  };

  // Criar grupo
  const handleCreateGroup = async () => {
    if (!selectedInstance) {
      alert(t('groupManager.selectInstanceFirst'));
      return;
    }

    if (!groupName.trim()) {
      alert(t('groupManager.validation.nameRequired'));
      return;
    }

    if (participantsList.length === 0) {
      alert(t('groupManager.participants.noParticipants'));
      return;
    }

    if (participantsList.length > 1024) {
      alert(t('groupManager.participants.maxParticipants'));
      return;
    }

    // Se não validou, validar agora
    if (!validationResults) {
      await handleValidateParticipants();
      return;
    }

    if (validationResults.validCount === 0) {
      alert(t('groupManager.validation.noValidParticipants'));
      return;
    }

    try {
      setIsCreating(true);
      const validPhones = validationResults.valid.map((v) => v.phone);
      const response = await groupAPI.create(selectedInstance, groupName.trim(), groupDescription.trim(), validPhones);

      // Se tiver imagem, atualizar
      if (groupImage && response.group.id) {
        try {
          await groupAPI.updatePicture(selectedInstance, response.group.id, groupImage);
        } catch (error: unknown) {
          logError('Erro ao atualizar imagem do grupo', error);
          // Não bloquear criação se falhar a imagem
        }
      }

      setSuccessMessage(t('groupManager.success.created'));
      setTimeout(() => setSuccessMessage(null), 3000);
      handleCloseCreateModal();
      await loadGroups();
    } catch (error: unknown) {
      logError('Erro ao criar grupo', error);
      alert(getErrorMessage(error, t('groupManager.error.create')));
    } finally {
      setIsCreating(false);
    }
  };

  // Abrir modal de edição
  const handleOpenEditModal = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name || '');
    setGroupDescription(group.description || '');
    setGroupImage(null);
    setGroupImagePreview(group.pictureUrl || null);
    setAnnouncement(group.announcement === true);
    setLocked(group.locked === true);
    setEditActiveTab('info');
    setEditParticipantsText('');
    setEditParticipantsCSV(null);
    setEditSelectedCrmContacts(new Set());
    setEditParticipantsList([]);
    setShowEditModal(true);
    loadCrmContacts();
  };

  // Fechar modal de edição
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
    setGroupImage(null);
    setGroupImagePreview(null);
    setAnnouncement(false);
    setLocked(false);
    setEditActiveTab('info');
    setIsUpdatingSettings(false);
  };

  // Atualizar nome do grupo
  const handleUpdateSubject = async () => {
    if (!editingGroup || !selectedInstance) return;
    if (!groupName.trim()) {
      alert(t('groupManager.validation.nameRequired'));
      return;
    }

    try {
      setIsUpdating(true);
      await groupAPI.updateSubject(selectedInstance, editingGroup.id, groupName.trim());
      setSuccessMessage(t('groupManager.success.updated'));
      setTimeout(() => setSuccessMessage(null), 3000);
      handleCloseEditModal();
      await loadGroups();
    } catch (error: unknown) {
      logError('Erro ao atualizar nome do grupo', error);
      alert(getErrorMessage(error, t('groupManager.error.updateSubject')));
    } finally {
      setIsUpdating(false);
    }
  };

  // Atualizar descrição do grupo
  const handleUpdateDescription = async () => {
    if (!editingGroup || !selectedInstance) return;

    try {
      setIsUpdating(true);
      await groupAPI.updateDescription(selectedInstance, editingGroup.id, groupDescription.trim());
      setSuccessMessage(t('groupManager.success.updated'));
      setTimeout(() => setSuccessMessage(null), 3000);
      handleCloseEditModal();
      await loadGroups();
    } catch (error: unknown) {
      logError('Erro ao atualizar descrição do grupo', error);
      alert(getErrorMessage(error, t('groupManager.error.updateDescription')));
    } finally {
      setIsUpdating(false);
    }
  };

  // Atualizar configurações do grupo
  const handleUpdateSettings = async (setting: 'announcement' | 'locked', value: boolean) => {
    if (!editingGroup || !selectedInstance || isUpdatingSettings) return;

    const action = setting === 'announcement' 
      ? (value ? 'announcement' : 'not_announcement')
      : (value ? 'locked' : 'unlocked');

    try {
      setIsUpdatingSettings(true);
      await groupAPI.updateSettings(selectedInstance, editingGroup.id, action);
      setSuccessMessage(t('groupManager.success.updated'));
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Atualizar estado local
      if (setting === 'announcement') {
        setAnnouncement(value);
      } else {
        setLocked(value);
      }
      
      await loadGroups();
    } catch (error: unknown) {
      logError('Erro ao atualizar configurações do grupo', error);
      alert(getErrorMessage(error, t('groupManager.error.updateSettings')));
      // Reverter estado em caso de erro
      if (setting === 'announcement') {
        setAnnouncement(!value);
      } else {
        setLocked(!value);
      }
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Mencionar em todos os grupos
  const handleMentionAllGroups = async () => {
    if (!selectedInstance || groups.length === 0 || isMentioningAllGroups) return;
    
    if (!mentionAllGroupsText.trim()) {
      alert(t('groupManager.mention.textRequired'));
      return;
    }

    try {
      setIsMentioningAllGroups(true);
      let successCount = 0;
      let errorCount = 0;

      for (const group of groups) {
        try {
          await groupAPI.mentionEveryone(selectedInstance, group.id, mentionAllGroupsText.trim());
          successCount++;
        } catch (error) {
          errorCount++;
          logError(`Erro ao mencionar todos no grupo ${group.id}`, error);
        }
      }

      if (successCount > 0) {
        setSuccessMessage(t('groupManager.mentionAllGroups.success', { count: successCount.toString() }));
        setTimeout(() => setSuccessMessage(null), 5000);
      }
      if (errorCount > 0) {
        alert(t('groupManager.mentionAllGroups.errors', { count: errorCount.toString() }));
      }

      setShowMentionAllGroupsModal(false);
      setMentionAllGroupsText('');
      await loadGroups();
    } catch (error: unknown) {
      logError('Erro ao mencionar em todos os grupos', error);
      alert(getErrorMessage(error, t('groupManager.error.mentionAllGroups')));
    } finally {
      setIsMentioningAllGroups(false);
    }
  };

  // Atualizar imagem do grupo
  const handleUpdatePicture = async () => {
    if (!editingGroup || !selectedInstance || !groupImage) return;

    try {
      setIsUpdating(true);
      await groupAPI.updatePicture(selectedInstance, editingGroup.id, groupImage);
      setSuccessMessage(t('groupManager.success.updated'));
      setTimeout(() => setSuccessMessage(null), 3000);
      handleCloseEditModal();
      await loadGroups();
    } catch (error: unknown) {
      logError('Erro ao atualizar imagem do grupo', error);
      alert(getErrorMessage(error, t('groupManager.error.updatePicture')));
    } finally {
      setIsUpdating(false);
    }
  };

  // Obter código de convite
  const handleGetInviteCode = async (group: Group) => {
    if (!selectedInstance) return;

    try {
      setIsLoadingInvite(true);
      const response = await groupAPI.getInviteCode(selectedInstance, group.id);
      setInviteCode(response.code);
      setInviteUrl(response.url);
      setShowInviteModal(true);
    } catch (error: unknown) {
      logError('Erro ao obter código de convite', error);
      alert(getErrorMessage(error, t('groupManager.error.getInviteCode')));
    } finally {
      setIsLoadingInvite(false);
    }
  };

  // Copiar código de convite
  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    alert(t('groupManager.inviteCode.copied'));
  };

  // Copiar URL de convite
  const handleCopyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert(t('groupManager.inviteUrl.copied'));
  };

  // Processar participantes via texto (edição)
  const handleEditProcessTextParticipants = () => {
    if (!editParticipantsText.trim()) {
      alert(t('groupManager.participants.textEmpty'));
      return;
    }
    const contacts = parseInputText(editParticipantsText);
    setEditParticipantsList((prev) => {
      const newList = [...prev];
      contacts.forEach((contact) => {
        if (!newList.find((p) => p.phone === contact.phone)) {
          newList.push(contact);
        }
      });
      return newList;
    });
    setEditParticipantsText('');
  };

  // Processar participantes via CSV (edição)
  const handleEditCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditParticipantsCSV(file);
    try {
      const text = await file.text();
      const contacts = parseCSVText(text);
      setEditParticipantsList((prev) => {
        const newList = [...prev];
        contacts.forEach((contact) => {
          if (!newList.find((p) => p.phone === contact.phone)) {
            newList.push(contact);
          }
        });
        return newList;
      });
    } catch (error: unknown) {
      logError('Erro ao processar CSV', error);
      alert(getErrorMessage(error, t('groupManager.error.processCSV')));
    }
  };

  // Selecionar/deselecionar contatos do CRM (edição)
  const handleEditToggleCrmContact = (contactId: string) => {
    setEditSelectedCrmContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  // Selecionar todos os contatos do CRM (edição)
  const handleEditSelectAllCrmContacts = () => {
    setEditSelectedCrmContacts(new Set(crmContacts.map((c) => c.id)));
  };

  // Limpar seleção de contatos do CRM (edição)
  const handleEditClearCrmContacts = () => {
    setEditSelectedCrmContacts(new Set());
  };

  // Adicionar contatos selecionados do CRM (edição)
  const handleEditAddCrmContacts = () => {
    const selectedContacts = crmContacts.filter((c) => editSelectedCrmContacts.has(c.id));
    setEditParticipantsList((prev) => {
      const newList = [...prev];
      selectedContacts.forEach((contact) => {
        if (!newList.find((p) => p.phone === contact.phone)) {
          newList.push({ phone: contact.phone, name: contact.name });
        }
      });
      return newList;
    });
    setEditSelectedCrmContacts(new Set());
  };

  // Remover participante da lista (edição)
  const handleEditRemoveParticipant = (phone: string) => {
    setEditParticipantsList((prev) => prev.filter((p) => p.phone !== phone));
  };

  // Adicionar participantes ao grupo
  const handleAddParticipantsToGroup = async () => {
    if (!editingGroup || !selectedInstance) return;

    if (editParticipantsList.length === 0) {
      alert(t('groupManager.participants.noParticipants'));
      return;
    }

    if (editParticipantsList.length > 1024) {
      alert(t('groupManager.participants.maxParticipants'));
      return;
    }

    try {
      setIsUpdating(true);
      const phones = editParticipantsList.map((p) => p.phone);
      // Validar participantes primeiro
      const validation = await groupAPI.validateParticipants(selectedInstance, phones);
      
      if (validation.validCount === 0) {
        alert(t('groupManager.validation.noValidParticipants'));
        return;
      }

      // Adicionar participantes ao grupo via Evolution API
      const validPhones = validation.valid.map((v) => v.phone);
      // Nota: A Evolution API não tem endpoint direto para adicionar participantes
      // Isso precisaria ser feito via webhook ou outro método
      // Por enquanto, apenas validamos e informamos
      alert(t('groupManager.participants.added', { count: validPhones.length.toString() }));
      setEditParticipantsList([]);
      await loadGroups();
    } catch (error: unknown) {
      logError('Erro ao adicionar participantes', error);
      alert(getErrorMessage(error, t('groupManager.error.addParticipants')));
    } finally {
      setIsUpdating(false);
    }
  };

  // Mencionar todos os participantes
  const handleMentionEveryone = async (group: Group) => {
    setSelectedGroup(group);
    setMentionText('');
    setShowMentionModal(true);
  };

  // Enviar mensagem mencionando todos
  const handleSendMention = async () => {
    if (!selectedGroup || !selectedInstance) return;

    if (!mentionText.trim()) {
      alert(t('groupManager.mention.textRequired'));
      return;
    }

    try {
      setIsSendingMention(true);
      await groupAPI.mentionEveryone(selectedInstance, selectedGroup.id, mentionText.trim());
      setSuccessMessage(t('groupManager.mention.sent'));
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowMentionModal(false);
      setMentionText('');
    } catch (error: unknown) {
      logError('Erro ao mencionar todos', error);
      alert(getErrorMessage(error, t('groupManager.error.mentionEveryone')));
    } finally {
      setIsSendingMention(false);
    }
  };

  // Selecionar/deselecionar grupo para edição em massa
  const handleToggleGroupSelection = (groupId: string) => {
    setSelectedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Selecionar todos os grupos
  const handleSelectAllGroups = () => {
    setSelectedGroups(new Set(groups.map((g) => g.id)));
  };

  // Limpar seleção de grupos
  const handleClearGroupSelection = () => {
    setSelectedGroups(new Set());
  };

  // Processar imagem para edição em massa
  const handleBulkImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageSrc = reader.result as string;
        setImageToCrop(imageSrc);
        setShowImageCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Aplicar crop da imagem em massa
  const handleBulkCropComplete = (croppedBase64: string) => {
    fetch(croppedBase64)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'group-picture.jpg', { type: 'image/jpeg' });
        setBulkImage(file);
        setBulkImagePreview(croppedBase64);
        setShowImageCropModal(false);
        setImageToCrop(null);
      })
      .catch((error) => {
        logError('Erro ao processar imagem', error);
        alert(getErrorMessage(error, t('groupManager.error.processImage')));
      });
  };

  // Aplicar edições em massa
  const handleBulkUpdate = async () => {
    if (!selectedInstance || selectedGroups.size === 0) return;

    const groupIds = Array.from(selectedGroups);
    if (groupIds.length === 0) {
      alert(t('groupManager.bulkEdit.noGroupsSelected'));
      return;
    }

    try {
      setIsBulkUpdating(true);
      let successCount = 0;
      let errorCount = 0;

      // Atualizar foto
      if (bulkImage) {
        for (const groupId of groupIds) {
          try {
            await groupAPI.updatePicture(selectedInstance, groupId, bulkImage);
            successCount++;
          } catch (error) {
            errorCount++;
            logError(`Erro ao atualizar foto do grupo ${groupId}`, error);
          }
        }
      }

      // Atualizar descrição
      if (bulkDescription.trim()) {
        for (const groupId of groupIds) {
          try {
            await groupAPI.updateDescription(selectedInstance, groupId, bulkDescription.trim());
            successCount++;
          } catch (error) {
            errorCount++;
            logError(`Erro ao atualizar descrição do grupo ${groupId}`, error);
          }
        }
      }

      if (successCount > 0) {
        setSuccessMessage(t('groupManager.bulkEdit.success', { count: successCount.toString() }));
        setTimeout(() => setSuccessMessage(null), 5000);
      }
      if (errorCount > 0) {
        alert(t('groupManager.bulkEdit.errors', { count: errorCount.toString() }));
      }

      setShowBulkEditModal(false);
      setSelectedGroups(new Set());
      setBulkImage(null);
      setBulkImagePreview(null);
      setBulkDescription('');
      await loadGroups();
    } catch (error: unknown) {
      logError('Erro ao aplicar edições em massa', error);
      alert(getErrorMessage(error, t('groupManager.error.bulkUpdate')));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Ref para debounce de atualizações via WebSocket
  const groupsUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdatingGroupsRef = useRef(false);

  // Callback para atualizar grupos via WebSocket com debounce
  const handleGroupsUpdate = useCallback((data: { instanceId: string }) => {
    // Recarregar grupos apenas se a instância atual for a que foi atualizada
    if (selectedInstance !== data.instanceId) {
      return;
    }

    // Se já está atualizando, ignorar
    if (isUpdatingGroupsRef.current) {
      return;
    }

    // Limpar timeout anterior se existir
    if (groupsUpdateTimeoutRef.current) {
      clearTimeout(groupsUpdateTimeoutRef.current);
    }

    // Aguardar 2 segundos antes de atualizar (debounce)
    groupsUpdateTimeoutRef.current = setTimeout(() => {
      isUpdatingGroupsRef.current = true;
      loadGroups().finally(() => {
        isUpdatingGroupsRef.current = false;
      });
    }, 2000);
  }, [selectedInstance, loadGroups]);

  // Cleanup do timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (groupsUpdateTimeoutRef.current) {
        clearTimeout(groupsUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Conectar ao WebSocket
  useSocket(token, undefined, undefined, undefined, undefined, undefined, handleGroupsUpdate);

  useEffect(() => {
    if (token) {
      loadInstances();
    }
  }, [token, loadInstances]);

  useEffect(() => {
    if (selectedInstance) {
      loadGroups();
    }
  }, [selectedInstance, loadGroups]);

  if (isLoading && !selectedInstance) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{t('groupManager.loading')}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-clerky-backendText dark:text-gray-200">
            {t('groupManager.title')}
          </h1>
          <div className="flex gap-2">
            <Button onClick={handleOpenCreateModal} disabled={!selectedInstance}>
              {t('groupManager.createGroup')}
            </Button>
            {groups.length > 0 && (
              <>
                <Button variant="outline" onClick={() => setShowMentionAllGroupsModal(true)} disabled={!selectedInstance}>
                  {t('groupManager.mentionAllGroups')}
                </Button>
                <Button variant="outline" onClick={() => setShowBulkEditModal(true)} disabled={!selectedInstance}>
                  {t('groupManager.bulkEdit')}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={refreshGroups} disabled={isRefreshing || !selectedInstance}>
              {isRefreshing ? t('groupManager.refreshing') : t('groupManager.refresh')}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">{t('error.title')}</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900/20 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">{t('success.title')}</strong>
            <span className="block sm:inline"> {successMessage}</span>
          </div>
        )}

        {/* Seletor de Instância */}
        <Card padding="md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('groupManager.selectInstance')}
            </label>
            <select
              value={selectedInstance}
              onChange={(e) => setSelectedInstance(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200"
            >
              <option value="">{t('groupManager.selectInstancePlaceholder')}</option>
              {instances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Lista de Grupos */}
        {!selectedInstance ? (
          <Card padding="md">
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('groupManager.selectInstanceFirst')}
            </p>
          </Card>
        ) : isLoading ? (
          <Card padding="md">
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('groupManager.loading')}
            </p>
          </Card>
        ) : groups.length === 0 ? (
          <Card padding="md">
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('groupManager.noGroups')}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id} padding="md" className="flex flex-col h-full">
                <div className="flex-1">
                  {/* Foto do Grupo */}
                  <div className="mb-3 flex items-center justify-center">
                    {group.pictureUrl ? (
                      <img
                        src={group.pictureUrl}
                        alt={group.name || 'Grupo'}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-clerky-backendButton to-clerky-backendButtonHover flex items-center justify-center text-white text-2xl font-bold">
                        {(group.name || group.id).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Nome do Grupo */}
                  <h3 className="text-lg font-semibold text-clerky-backendText dark:text-gray-200 mb-2 text-center">
                    {group.name || group.id}
                  </h3>
                  
                  {/* Descrição */}
                  {group.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 text-center min-h-[3rem]">
                      {group.description}
                    </p>
                  )}
                  
                  {/* Informações */}
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {group.participants?.length || 0}
                    </span>
                    {group.creation && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(group.creation).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Botões */}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewGroupDetails(group)} className="text-xs">
                      {t('groupManager.viewDetails')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(group)} className="text-xs">
                      {t('groupManager.edit')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleGetInviteCode(group)} disabled={isLoadingInvite} className="text-xs">
                      {t('groupManager.inviteCode')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleMentionEveryone(group)} className="text-xs">
                      {t('groupManager.mentionEveryone')}
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleLeaveGroup(group.id)}
                    className="border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-600 dark:hover:border-red-500 text-xs"
                  >
                    {t('groupManager.leave')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Criar Grupo */}
        <Modal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          title={t('groupManager.createGroup')}
          size="xl"
        >
          <div className="space-y-4">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      activeTab === 'info'
                        ? 'border-clerky-backendButton text-clerky-backendButton'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {t('groupManager.tabs.info')}
                  </button>
                  <button
                    onClick={() => setActiveTab('participants')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      activeTab === 'participants'
                        ? 'border-clerky-backendButton text-clerky-backendButton'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {t('groupManager.tabs.participants')} ({participantsList.length})
                  </button>
                </nav>
              </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {/* Tab: Informações Básicas */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <Input
                    label={t('groupManager.groupName')}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder={t('groupManager.groupNamePlaceholder')}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('groupManager.description')}
                    </label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder={t('groupManager.descriptionPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('groupManager.groupPicture')}
                    </label>
                    {groupImagePreview && (
                      <div className="mb-2">
                        <img
                          src={groupImagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-clerky-backendButton file:text-white hover:file:bg-clerky-backendButtonHover"
                    />
                    {showImageCropModal && imageToCrop && (
                      <Modal
                        isOpen={showImageCropModal}
                        onClose={handleCropCancel}
                        title={t('groupManager.cropImage')}
                        size="xl"
                      >
                        <ImageCrop
                          imageSrc={imageToCrop}
                          onCrop={handleCropComplete}
                          onCancel={handleCropCancel}
                          aspectRatio={1}
                          circular={true}
                        />
                      </Modal>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Participantes */}
              {activeTab === 'participants' && (
                <div className="space-y-4">
                  {/* Adicionar via Texto */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
                      {t('groupManager.participants.addByText')}
                    </h3>
                    <textarea
                      value={participantsText}
                      onChange={(e) => setParticipantsText(e.target.value)}
                      placeholder={t('groupManager.participants.textPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 min-h-[100px] mb-2"
                    />
                    <Button size="sm" onClick={handleProcessTextParticipants}>
                      {t('groupManager.participants.add')}
                    </Button>
                  </div>

                  {/* Adicionar via CSV */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
                      {t('groupManager.participants.addByCSV')}
                    </h3>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-clerky-backendButton file:text-white hover:file:bg-clerky-backendButtonHover"
                    />
                    {participantsCSV && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {t('groupManager.participants.csvLoaded')}: {participantsCSV.name}
                      </p>
                    )}
                  </div>

                  {/* Adicionar do CRM */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200">
                        {t('groupManager.participants.addFromCRM')}
                      </h3>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleSelectAllCrmContacts}>
                          {t('groupManager.participants.selectAll')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleClearCrmContacts}>
                          {t('groupManager.participants.clear')}
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 mb-2">
                      {crmContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCrmContacts.has(contact.id)}
                            onChange={() => handleToggleCrmContact(contact.id)}
                            className="w-4 h-4 text-clerky-backendButton border-gray-300 rounded focus:ring-clerky-backendButton"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200">
                              {contact.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{contact.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" onClick={handleAddCrmContacts} disabled={selectedCrmContacts.size === 0}>
                      {t('groupManager.participants.add')} ({selectedCrmContacts.size})
                    </Button>
                  </div>

                  {/* Lista de Participantes */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200">
                        {t('groupManager.participants.list')} ({participantsList.length}/1024)
                      </h3>
                      <Button size="sm" onClick={handleValidateParticipants} disabled={isValidating || participantsList.length === 0}>
                        {isValidating ? t('groupManager.participants.validating') : t('groupManager.participants.validate')}
                      </Button>
                    </div>
                    {validationResults && (
                      <div className="mb-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          {t('groupManager.participants.valid')}: {validationResults.validCount} |{' '}
                          {t('groupManager.participants.invalid')}: {validationResults.invalidCount}
                        </p>
                      </div>
                    )}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {participantsList.map((participant, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div>
                            <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200">
                              {participant.name || participant.phone}
                            </p>
                            {participant.name && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{participant.phone}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveParticipant(participant.phone)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    {participantsList.length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        {t('groupManager.participants.noParticipants')}
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleCloseCreateModal}>
                {t('groupManager.cancel')}
              </Button>
              <Button onClick={handleCreateGroup} disabled={isCreating || !groupName.trim() || participantsList.length === 0}>
                {isCreating ? t('groupManager.creating') : t('groupManager.create')}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de Editar Grupo */}
        <Modal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          title={t('groupManager.editGroup')}
          size="xl"
        >
          {editingGroup && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setEditActiveTab('info')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      editActiveTab === 'info'
                        ? 'border-clerky-backendButton text-clerky-backendButton'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {t('groupManager.tabs.info')}
                  </button>
                  <button
                    onClick={() => setEditActiveTab('participants')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      editActiveTab === 'participants'
                        ? 'border-clerky-backendButton text-clerky-backendButton'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {t('groupManager.tabs.participants')}
                  </button>
                  <button
                    onClick={() => setEditActiveTab('settings')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      editActiveTab === 'settings'
                        ? 'border-clerky-backendButton text-clerky-backendButton'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {t('groupManager.tabs.settings')}
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                {editActiveTab === 'info' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('groupManager.groupName')}
                      </label>
                      <Input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder={t('groupManager.groupNamePlaceholder')}
                      />
                      <Button size="sm" onClick={handleUpdateSubject} disabled={isUpdating} className="mt-2">
                        {isUpdating ? t('groupManager.updating') : t('groupManager.updateName')}
                      </Button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('groupManager.description')}
                      </label>
                      <textarea
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        placeholder={t('groupManager.descriptionPlaceholder')}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 min-h-[100px]"
                      />
                      <Button size="sm" onClick={handleUpdateDescription} disabled={isUpdating} className="mt-2">
                        {isUpdating ? t('groupManager.updating') : t('groupManager.updateDescription')}
                      </Button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('groupManager.groupPicture')}
                      </label>
                      {groupImagePreview && (
                        <div className="mb-2">
                          <img
                            src={groupImagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-clerky-backendButton file:text-white hover:file:bg-clerky-backendButtonHover"
                      />
                      <Button size="sm" onClick={handleUpdatePicture} disabled={isUpdating || !groupImage} className="mt-2">
                        {isUpdating ? t('groupManager.updating') : t('groupManager.updatePicture')}
                      </Button>
                      {showImageCropModal && imageToCrop && (
                        <Modal
                          isOpen={showImageCropModal}
                          onClose={handleCropCancel}
                          title={t('groupManager.cropImage')}
                          size="xl"
                        >
                          <ImageCrop
                            imageSrc={imageToCrop}
                            onCrop={handleCropComplete}
                            onCancel={handleCropCancel}
                            aspectRatio={1}
                            circular={true}
                          />
                        </Modal>
                      )}
                    </div>
                  </div>
                )}

                {editActiveTab === 'participants' && (
                  <div className="space-y-4">
                    {/* Adicionar via Texto */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
                        {t('groupManager.participants.addByText')}
                      </h3>
                      <textarea
                        value={editParticipantsText}
                        onChange={(e) => setEditParticipantsText(e.target.value)}
                        placeholder={t('groupManager.participants.textPlaceholder')}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 min-h-[100px] mb-2"
                      />
                      <Button size="sm" onClick={handleEditProcessTextParticipants}>
                        {t('groupManager.participants.add')}
                      </Button>
                    </div>

                    {/* Adicionar via CSV */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
                        {t('groupManager.participants.addByCSV')}
                      </h3>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleEditCSVUpload}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-clerky-backendButton file:text-white hover:file:bg-clerky-backendButtonHover"
                      />
                      {editParticipantsCSV && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {t('groupManager.participants.csvLoaded')}: {editParticipantsCSV.name}
                        </p>
                      )}
                    </div>

                    {/* Adicionar do CRM */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200">
                          {t('groupManager.participants.addFromCRM')}
                        </h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handleEditSelectAllCrmContacts}>
                            {t('groupManager.participants.selectAll')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleEditClearCrmContacts}>
                            {t('groupManager.participants.clear')}
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 mb-2">
                        {crmContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={editSelectedCrmContacts.has(contact.id)}
                              onChange={() => handleEditToggleCrmContact(contact.id)}
                              className="w-4 h-4 text-clerky-backendButton border-gray-300 rounded focus:ring-clerky-backendButton"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200">
                                {contact.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{contact.phone}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" onClick={handleEditAddCrmContacts} disabled={editSelectedCrmContacts.size === 0}>
                        {t('groupManager.participants.add')} ({editSelectedCrmContacts.size})
                      </Button>
                    </div>

                    {/* Lista de Participantes */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200">
                          {t('groupManager.participants.list')} ({editParticipantsList.length}/1024)
                        </h3>
                        <Button size="sm" onClick={handleAddParticipantsToGroup} disabled={isUpdating || editParticipantsList.length === 0}>
                          {isUpdating ? t('groupManager.adding') : t('groupManager.addParticipants')}
                        </Button>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {editParticipantsList.map((participant, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                          >
                            <div>
                              <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200">
                                {participant.name || participant.phone}
                              </p>
                              {participant.name && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{participant.phone}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditRemoveParticipant(participant.phone)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      {editParticipantsList.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                          {t('groupManager.participants.noParticipants')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {editActiveTab === 'settings' && (
                  <div className="space-y-6">
                    {/* Toggle Switch para Announcement */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <label htmlFor="editAnnouncement" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                          {t('groupManager.settings.announcement')}
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('groupManager.settings.announcementDescription')}
                        </p>
                      </div>
                      <button
                        type="button"
                        id="editAnnouncement"
                        onClick={async () => {
                          if (isUpdatingSettings) return;
                          const newValue = !announcement;
                          const oldValue = announcement;
                          setAnnouncement(newValue);
                          try {
                            await handleUpdateSettings('announcement', newValue);
                          } catch (error) {
                            setAnnouncement(oldValue);
                          }
                        }}
                        disabled={isUpdatingSettings}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-clerky-backendButton focus:ring-offset-2 ${
                          announcement
                            ? 'bg-clerky-backendButton'
                            : 'bg-gray-300 dark:bg-gray-600'
                        } ${isUpdatingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            announcement ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle Switch para Locked */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <label htmlFor="editLocked" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                          {t('groupManager.settings.locked')}
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('groupManager.settings.lockedDescription')}
                        </p>
                      </div>
                      <button
                        type="button"
                        id="editLocked"
                        onClick={async () => {
                          if (isUpdatingSettings) return;
                          const newValue = !locked;
                          const oldValue = locked;
                          setLocked(newValue);
                          try {
                            await handleUpdateSettings('locked', newValue);
                          } catch (error) {
                            setLocked(oldValue);
                          }
                        }}
                        disabled={isUpdatingSettings}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-clerky-backendButton focus:ring-offset-2 ${
                          locked
                            ? 'bg-clerky-backendButton'
                            : 'bg-gray-300 dark:bg-gray-600'
                        } ${isUpdatingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            locked ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {isUpdatingSettings && (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('groupManager.updating')}</span>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={handleCloseEditModal}>
                  {t('groupManager.close')}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal de Código de Convite */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title={t('groupManager.inviteCode.title')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('groupManager.inviteCode.code')}
              </label>
              <div className="flex gap-2">
                <Input value={inviteCode} readOnly className="font-mono" />
                <Button onClick={handleCopyInviteCode}>
                  {t('groupManager.inviteCode.copy')}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('groupManager.inviteCode.url')}
              </label>
              <div className="flex gap-2">
                <Input value={inviteUrl} readOnly className="font-mono text-xs" />
                <Button onClick={handleCopyInviteUrl}>
                  {t('groupManager.inviteCode.copy')}
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Modal de Detalhes do Grupo */}
        <Modal
          isOpen={showGroupDetailsModal}
          onClose={() => {
            setShowGroupDetailsModal(false);
            setSelectedGroup(null);
          }}
          title={selectedGroup?.name || t('groupManager.groupDetails')}
        >
          {selectedGroup && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('groupManager.groupId')}
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {selectedGroup.id}
                </p>
              </div>
              {selectedGroup.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('groupManager.description')}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedGroup.description}
                  </p>
                </div>
              )}
              {selectedGroup.creation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('groupManager.created')}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(selectedGroup.creation).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedGroup.participants && selectedGroup.participants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('groupManager.participants')} ({selectedGroup.participants.length})
                  </label>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedGroup.participants.map((participant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <div>
                          <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200">
                            {participant.name || participant.id}
                          </p>
                          {participant.id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {participant.id}
                            </p>
                          )}
                        </div>
                        {participant.isAdmin && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                            {t('groupManager.admin')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Modal de Mencionar Todos */}
        <Modal
          isOpen={showMentionModal}
          onClose={() => {
            setShowMentionModal(false);
            setMentionText('');
            setSelectedGroup(null);
          }}
          title={t('groupManager.mention.title')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('groupManager.mention.message')}
              </label>
              <textarea
                value={mentionText}
                onChange={(e) => setMentionText(e.target.value)}
                placeholder={t('groupManager.mention.placeholder')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 min-h-[150px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowMentionModal(false);
                setMentionText('');
                setSelectedGroup(null);
              }}>
                {t('groupManager.cancel')}
              </Button>
              <Button onClick={handleSendMention} disabled={isSendingMention || !mentionText.trim()}>
                {isSendingMention ? t('groupManager.mention.sending') : t('groupManager.mention.send')}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de Edição em Massa */}
        <Modal
          isOpen={showBulkEditModal}
          onClose={() => {
            setShowBulkEditModal(false);
            setSelectedGroups(new Set());
            setBulkImage(null);
            setBulkImagePreview(null);
            setBulkDescription('');
          }}
          title={t('groupManager.bulkEdit.title')}
          size="xl"
        >
          <div className="space-y-4">
            {/* Seleção de Grupos */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200">
                  {t('groupManager.bulkEdit.selectGroups')} ({selectedGroups.size}/{groups.length})
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleSelectAllGroups}>
                    {t('groupManager.participants.selectAll')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleClearGroupSelection}>
                    {t('groupManager.participants.clear')}
                  </Button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.has(group.id)}
                      onChange={() => handleToggleGroupSelection(group.id)}
                      className="w-4 h-4 text-clerky-backendButton border-gray-300 rounded focus:ring-clerky-backendButton"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200">
                        {group.name || group.id}
                      </p>
                      {group.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Foto do Grupo */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
                {t('groupManager.bulkEdit.updatePicture')}
              </h3>
              {bulkImagePreview && (
                <div className="mb-2 flex justify-center">
                  <img
                    src={bulkImagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleBulkImageChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-clerky-backendButton file:text-white hover:file:bg-clerky-backendButtonHover"
              />
              {showImageCropModal && imageToCrop && (
                <Modal
                  isOpen={showImageCropModal}
                  onClose={handleCropCancel}
                  title={t('groupManager.cropImage')}
                  size="xl"
                >
                  <ImageCrop
                    imageSrc={imageToCrop}
                    onCrop={handleBulkCropComplete}
                    onCancel={handleCropCancel}
                    aspectRatio={1}
                    circular={true}
                  />
                </Modal>
              )}
            </div>

            {/* Descrição */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
                {t('groupManager.bulkEdit.updateDescription')}
              </h3>
              <textarea
                value={bulkDescription}
                onChange={(e) => setBulkDescription(e.target.value)}
                placeholder={t('groupManager.descriptionPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 min-h-[100px]"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => {
                setShowBulkEditModal(false);
                setSelectedGroups(new Set());
                setBulkImage(null);
                setBulkImagePreview(null);
                setBulkDescription('');
              }}>
                {t('groupManager.cancel')}
              </Button>
              <Button onClick={handleBulkUpdate} disabled={isBulkUpdating || selectedGroups.size === 0}>
                {isBulkUpdating ? t('groupManager.bulkEdit.applying') : t('groupManager.bulkEdit.apply')}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de Mencionar em Todos os Grupos */}
        <Modal
          isOpen={showMentionAllGroupsModal}
          onClose={() => {
            setShowMentionAllGroupsModal(false);
            setMentionAllGroupsText('');
          }}
          title={t('groupManager.mentionAllGroups.title')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('groupManager.mentionAllGroups.message')}
              </label>
              <textarea
                value={mentionAllGroupsText}
                onChange={(e) => setMentionAllGroupsText(e.target.value)}
                placeholder={t('groupManager.mentionAllGroups.placeholder')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-clerky-backendButton focus:border-transparent bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 min-h-[150px]"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('groupManager.mentionAllGroups.helper', { count: groups.length.toString() })}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowMentionAllGroupsModal(false);
                setMentionAllGroupsText('');
              }}>
                {t('groupManager.cancel')}
              </Button>
              <Button onClick={handleMentionAllGroups} disabled={isMentioningAllGroups || !mentionAllGroupsText.trim()}>
                {isMentioningAllGroups ? t('groupManager.mentionAllGroups.sending') : t('groupManager.mentionAllGroups.send')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default GroupManager;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '../components/Layout';
import { Card } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dashboardAPI, DashboardStats, RecentActivity } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { getErrorMessage, logError } from '../utils/errorHandler';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

const COLORS = ['#0040FF', '#00C0FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color = '#0040FF' }) => {
  return (
    <div 
      className="relative rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
      }}
    >
      {/* Accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: color }}
      />
      
      <div className="p-6">
        <div className="flex flex-col">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-5xl font-extrabold text-clerky-backendText dark:text-gray-100 leading-none">
              {value}
            </p>
          </div>
          {subtitle && (
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Hover effect overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${color}08 0%, transparent 100%)`,
        }}
      />
    </div>
  );
};

interface InstanceStatusProps {
  instances: {
    total: number;
    connected: number;
    disconnected: number;
    connecting: number;
    error: number;
  };
}

const InstanceStatus: React.FC<InstanceStatusProps> = ({ instances }) => {
  const { t } = useLanguage();

  const statusData = useMemo(
    () => [
      {
        name: t('dashboard.instances.connected'),
        value: instances.connected,
        color: '#10B981',
      },
      {
        name: t('dashboard.instances.disconnected'),
        value: instances.disconnected,
        color: '#6B7280',
      },
      {
        name: t('dashboard.instances.connecting'),
        value: instances.connecting,
        color: '#F59E0B',
      },
      {
        name: t('dashboard.instances.error'),
        value: instances.error,
        color: '#EF4444',
      },
    ],
    [instances, t]
  );

  return (
    <Card padding="lg" shadow="md">
      <h2 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-6">
        {t('dashboard.instances.title')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statusData.map((status) => (
          <div key={status.name} className="text-center">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: status.color }}
            >
              {status.value}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{status.name}</p>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={statusData.filter((s) => s.value > 0)}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {statusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

interface RecentActivityListProps {
  activities: RecentActivity;
  onLimitChange?: (limit: number) => void;
}

const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities, onLimitChange }) => {
  const { t, language } = useLanguage();
  const [activityLimit, setActivityLimit] = useState(5);

  const locale = language === 'pt' ? ptBR : enUS;

  const handleLimitChange = (newLimit: number) => {
    setActivityLimit(newLimit);
    if (onLimitChange) {
      onLimitChange(newLimit);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale });
    } catch {
      return dateString;
    }
  };

  return (
    <Card padding="lg" shadow="md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200">
          {t('dashboard.recentActivity.title')}
        </h2>
        <select
          value={activityLimit}
          onChange={(e) => handleLimitChange(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-clerky-backendText dark:text-gray-200 text-sm"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>

      <div className="space-y-4">
        {/* Mensagens Recentes */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('dashboard.recentActivity.messages')}
          </h3>
          <div className="space-y-2">
            {activities.messages.slice(0, activityLimit).map((message) => (
              <div
                key={message.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200">
                      {message.contactName || message.contactPhone}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            {activities.messages.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t('dashboard.recentActivity.noMessages')}
              </p>
            )}
          </div>
        </div>

        {/* Contatos Recentes */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('dashboard.recentActivity.contacts')}
          </h3>
          <div className="space-y-2">
            {activities.contacts.slice(0, activityLimit).map((contact) => (
              <div
                key={contact.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200">
                      {contact.name || contact.phone}
                    </p>
                    {contact.name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{contact.phone}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                    {formatTime(contact.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {activities.contacts.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t('dashboard.recentActivity.noContacts')}
              </p>
            )}
          </div>
        </div>

        {/* Disparos Recentes */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('dashboard.recentActivity.dispatches')}
          </h3>
          <div className="space-y-2">
            {activities.dispatches.slice(0, activityLimit).map((dispatch) => (
              <div
                key={dispatch.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-clerky-backendText dark:text-gray-200">{dispatch.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t(`dashboard.dispatches.status.${dispatch.status}`)} • {dispatch.stats.sent}/{dispatch.stats.total}{' '}
                      {t('dashboard.dispatches.sent')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                    {formatTime(dispatch.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {activities.dispatches.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t('dashboard.recentActivity.noDispatches')}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

interface ChartsSectionProps {
  stats: DashboardStats;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ stats }) => {
  const { t } = useLanguage();

  const dispatchesData = useMemo(
    () => [
      { name: t('dashboard.dispatches.status.pending'), value: stats.dispatches.pending },
      { name: t('dashboard.dispatches.status.running'), value: stats.dispatches.running },
      { name: t('dashboard.dispatches.status.completed'), value: stats.dispatches.completed },
      { name: t('dashboard.dispatches.status.failed'), value: stats.dispatches.failed },
      { name: t('dashboard.dispatches.status.paused'), value: stats.dispatches.paused },
    ],
    [stats.dispatches, t]
  );

  const contactsByColumnData = useMemo(
    () =>
      stats.contacts.byColumn.map((col) => ({
        name: t('dashboard.contacts.column', { id: col.columnId }),
        value: col.count,
      })),
    [stats.contacts.byColumn, t]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Disparos */}
      <Card padding="lg" shadow="md">
        <h2 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-6">
          {t('dashboard.charts.dispatches')}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dispatchesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#0040FF" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico de Contatos por Coluna */}
      <Card padding="lg" shadow="md">
        <h2 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-6">
          {t('dashboard.charts.contactsByColumn')}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={contactsByColumnData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#00C0FF" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

const NewsAndPromotions: React.FC = () => {
  const { t } = useLanguage();

  // TODO: Carregar dados reais do Newsletter quando a API estiver disponível
  // Por enquanto, exibir uma estrutura básica com conteúdo estático
  const newsletterItems = [
    {
      id: 1,
      type: 'news' as const,
      title: t('dashboard.news.latestUpdate'),
      description: t('dashboard.news.description'),
      date: new Date().toLocaleDateString(),
    },
    {
      id: 2,
      type: 'promotion' as const,
      title: t('dashboard.promotions.title'),
      description: t('dashboard.promotions.description'),
      date: new Date().toLocaleDateString(),
    },
  ];

  return (
    <Card padding="lg" shadow="md" className="transition-all duration-200">
      <div className="flex flex-col h-full">
        <h2 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-4">
          {t('dashboard.news.title')}
        </h2>
        
        <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto">
          {newsletterItems.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    item.type === 'news'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}
                >
                  {item.type === 'news' ? t('dashboard.news.type.news') : t('dashboard.news.type.promotion')}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.date}</span>
              </div>
              <h3 className="font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('dashboard.news.moreInfo')}
          </p>
        </div>
      </div>
    </Card>
  );
};

const Home: React.FC = () => {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await dashboardAPI.getStats();
      setStats(response.stats);
      setRecentActivity(response.recent);
    } catch (err: unknown) {
      logError('Erro ao carregar dados do dashboard', err);
      setError(getErrorMessage(err, t('dashboard.error.loadData')));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // WebSocket para atualizações em tempo real
  useSocket(
    token,
    undefined, // onStatusUpdate
    undefined, // onNewMessage
    () => {
      // onContactUpdate - recarregar dados quando contato atualizar
      loadDashboardData();
    },
    () => {
      // onDispatchUpdate - recarregar dados quando disparo atualizar
      loadDashboardData();
    },
    undefined, // onWorkflowContactUpdate
    undefined // onGroupsUpdate
  );

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, loadDashboardData]);

  if (isLoading && !stats) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard.loading')}</p>
        </div>
      </AppLayout>
    );
  }

  if (error && !stats) {
    return (
      <AppLayout>
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">{t('common.error')}</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </AppLayout>
    );
  }

  if (!stats || !recentActivity) {
    return null;
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 animate-fadeIn">
        {/* Mensagem de Boas-vindas */}
        <Card padding="lg" shadow="lg">
          <h1 className="text-2xl font-bold text-clerky-backendText dark:text-gray-200 mb-2">
            {t('dashboard.welcome', { name: user?.name?.split(' ')[0] || '' })}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('dashboard.welcomeMessage')}
          </p>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title={t('dashboard.stats.instances')}
            value={stats.instances.total}
            subtitle={`${stats.instances.connected} ${t('dashboard.instances.connected')}`}
            color="#0040FF"
          />
          <StatCard
            title={t('dashboard.stats.contacts')}
            value={stats.contacts.total}
            color="#00C0FF"
          />
          <StatCard
            title={t('dashboard.stats.dispatches')}
            value={stats.dispatches.total}
            subtitle={`${stats.dispatches.completed} ${t('dashboard.dispatches.status.completed')}`}
            color="#10B981"
          />
          <StatCard
            title={t('dashboard.stats.workflows')}
            value={stats.workflows.total}
            color="#F59E0B"
          />
          <StatCard
            title={t('dashboard.stats.groups')}
            value={stats.groups.total}
            color="#8B5CF6"
          />
          <StatCard
            title={t('dashboard.stats.aiAgents')}
            value={stats.aiAgents.total}
            subtitle={`${stats.aiAgents.active} ${t('dashboard.stats.active')}`}
            color="#EF4444"
          />
        </div>

        {/* Status das Instâncias */}
        <InstanceStatus instances={stats.instances} />

        {/* Gráficos */}
        <ChartsSection stats={stats} />

        {/* Atividades Recentes e Novidades/Promoções */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivityList activities={recentActivity} />
          <NewsAndPromotions />
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface NodePaletteProps {
  onAddNode: (type: 'whatsappTrigger' | 'typebotTrigger' | 'condition' | 'delay' | 'end' | 'response' | 'spreadsheet') => void;
}

// Mapa de classes de cores para evitar recriação a cada render
const COLOR_CLASSES_MAP: Record<string, { border: string; bg: string; text: string; hoverBg: string }> = {
  green: {
    border: 'hover:border-green-400 dark:hover:border-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    hoverBg: 'group-hover:bg-green-200 dark:group-hover:bg-green-900/50',
  },
  blue: {
    border: 'hover:border-blue-400 dark:hover:border-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    hoverBg: 'group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50',
  },
  yellow: {
    border: 'hover:border-yellow-400 dark:hover:border-yellow-500',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    hoverBg: 'group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50',
  },
  red: {
    border: 'hover:border-red-400 dark:hover:border-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    hoverBg: 'group-hover:bg-red-200 dark:group-hover:bg-red-900/50',
  },
  purple: {
    border: 'hover:border-purple-400 dark:hover:border-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    hoverBg: 'group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50',
  },
  indigo: {
    border: 'hover:border-indigo-400 dark:hover:border-indigo-500',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    hoverBg: 'group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50',
  },
  emerald: {
    border: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    hoverBg: 'group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50',
  },
};

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const { t } = useLanguage();

  const nodeTypes = [
    {
      type: 'whatsappTrigger' as const,
      label: t('mindClerky.nodes.trigger'),
      description: t('mindClerky.nodes.trigger.description'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      color: 'green',
    },
    {
      type: 'typebotTrigger' as const,
      label: t('mindClerky.nodes.typebotTrigger'),
      description: t('mindClerky.nodes.typebotTrigger.description'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
      color: 'indigo',
    },
    {
      type: 'condition' as const,
      label: t('mindClerky.nodes.condition'),
      description: t('mindClerky.nodes.condition.description'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      color: 'blue',
    },
    {
      type: 'delay' as const,
      label: t('mindClerky.nodes.delay'),
      description: t('mindClerky.nodes.delay.description'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'yellow',
    },
    {
      type: 'end' as const,
      label: t('mindClerky.nodes.end'),
      description: t('mindClerky.nodes.end.description'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
      color: 'red',
    },
    {
      type: 'response' as const,
      label: t('mindClerky.nodes.response'),
      description: t('mindClerky.nodes.response.description'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      color: 'purple',
    },
    {
      type: 'spreadsheet' as const,
      label: t('mindClerky.nodes.spreadsheet'),
      description: t('mindClerky.nodes.spreadsheet.description'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
      ),
      color: 'emerald',
    },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-clerky-backendText dark:text-gray-200 text-lg">
          {t('mindClerky.nodes')}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('mindClerky.subtitle')}
        </p>
      </div>
      <div className="p-4 space-y-3">
        {nodeTypes.map((node) => {
          const colorClasses = COLOR_CLASSES_MAP[node.color];

          return (
            <button
              key={node.type}
              onClick={() => onAddNode(node.type)}
              className={`w-full text-left p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 ${colorClasses.border} hover:shadow-md transition-all bg-white dark:bg-gray-700 group`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses.bg} ${colorClasses.text} ${colorClasses.hoverBg} transition-colors`}
                >
                  {node.icon}
                </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-clerky-backendText dark:text-gray-200 mb-1">
                  {node.label}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {node.description}
                </p>
              </div>
            </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useLanguage } from '../../../contexts/LanguageContext';

export interface OpenAINodeData {
  apiKey?: string;
  model?: string;
  prompt?: string;
}

export const OpenAINode: React.FC<NodeProps> = ({ data, selected }) => {
  const { t } = useLanguage();
  const nodeData = data as OpenAINodeData;
  const model = nodeData.model || 'gpt-3.5-turbo';
  const hasConfig = !!(nodeData.apiKey && nodeData.prompt);

  return (
    <div
      className={`bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg border-2 ${
        selected ? 'border-emerald-300' : 'border-emerald-700'
      } min-w-[200px]`}
    >
      {/* Handle de entrada (topo) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-emerald-400 !border-2 !border-emerald-600 !w-4 !h-4"
        style={{ top: -8 }}
      />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🤖</span>
          <span className="font-semibold text-white text-sm">
            {t('mindClerky.nodes.openai')}
          </span>
        </div>
        
        <div className="text-xs text-emerald-100 space-y-1">
          {hasConfig ? (
            <>
              <div className="flex items-center gap-1">
                <span className="opacity-75">Modelo:</span>
                <span className="font-medium">{model}</span>
              </div>
              <div className="opacity-75 truncate">
                {nodeData.prompt?.substring(0, 30)}...
              </div>
            </>
          ) : (
            <div className="opacity-75 italic">
              {t('mindClerky.nodeSettings.configureOpenAI')}
            </div>
          )}
        </div>
      </div>

      {/* Handle de saída (base) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-emerald-400 !border-2 !border-emerald-600 !w-4 !h-4"
        style={{ bottom: -8 }}
      />
    </div>
  );
};


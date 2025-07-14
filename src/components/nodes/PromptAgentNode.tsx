import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot } from 'lucide-react';

interface PromptAgentNodeProps {
  data: {
    label?: string;
    agentType?: string;
    systemPrompt?: string;
  };
  selected?: boolean;
}

const PromptAgentNode = memo(({ data, selected }: PromptAgentNodeProps) => {
  return (
    <div className={`agent-node node-agent ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-white p-4 min-w-[180px]">
        <Bot className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Prompt Agent'}</span>
        <div className="w-full space-y-1">
          <input 
            type="text" 
            placeholder={data.agentType || 'Agent type'}
            className="w-full px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
            onClick={(e) => e.stopPropagation()}
          />
          <textarea 
            placeholder={data.systemPrompt || 'System prompt...'}
            rows={2}
            className="w-full px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white placeholder-white/60 resize-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

PromptAgentNode.displayName = 'PromptAgentNode';

export default PromptAgentNode;
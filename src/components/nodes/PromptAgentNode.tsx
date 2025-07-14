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
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[180px]">
        <Bot className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Prompt Agent'}</span>
        <div className="w-full space-y-1">
          <input 
            type="text" 
            placeholder={data.agentType || 'Agent type'}
            className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          />
          <textarea 
            placeholder={data.systemPrompt || 'System prompt...'}
            rows={2}
            className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground resize-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

PromptAgentNode.displayName = 'PromptAgentNode';

export default PromptAgentNode;
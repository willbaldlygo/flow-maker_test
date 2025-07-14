import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Bot } from 'lucide-react';

interface PromptAgentNodeProps {
  id: string;
  data: {
    label?: string;
    agentType?: string;
    systemPrompt?: string;
  };
  selected?: boolean;
}

const PromptAgentNode = memo(({ id, data, selected }: PromptAgentNodeProps) => {
  const { setNodes } = useReactFlow();

  const handleAgentTypeChange = (value: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, agentType: value } }
          : node
      )
    );
  };

  const handleSystemPromptChange = (value: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, systemPrompt: value } }
          : node
      )
    );
  };

  return (
    <div className={`agent-node node-agent ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[180px]">
        <Bot className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Prompt Agent'}</span>
        <div className="w-full space-y-1">
          <input 
            type="text" 
            value={data.agentType || ''}
            placeholder="Agent type"
            className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground"
            onChange={(e) => handleAgentTypeChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <textarea 
            value={data.systemPrompt || ''}
            placeholder="System prompt..."
            rows={2}
            className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground resize-none"
            onChange={(e) => handleSystemPromptChange(e.target.value)}
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
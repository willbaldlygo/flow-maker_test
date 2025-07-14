import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Brain } from 'lucide-react';

interface PromptLLMNodeProps {
  id: string;
  data: {
    label?: string;
    model?: string;
    temperature?: number;
  };
  selected?: boolean;
}

const PromptLLMNode = memo(({ id, data, selected }: PromptLLMNodeProps) => {
  const { setNodes } = useReactFlow();

  const handleModelChange = (value: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, model: value } }
          : node
      )
    );
  };

  const handleTemperatureChange = (value: string) => {
    const temperature = value === '' ? undefined : parseFloat(value);
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, temperature } }
          : node
      )
    );
  };

  return (
    <div className={`agent-node node-llm ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[180px]">
        <Brain className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Prompt LLM'}</span>
        <div className="w-full space-y-1">
          <input 
            type="text" 
            value={data.model || ''}
            placeholder="Model (e.g., gpt-4)"
            className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground"
            onChange={(e) => handleModelChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <input 
            type="number" 
            value={data.temperature !== undefined ? data.temperature.toString() : ''}
            placeholder="Temperature"
            min="0"
            max="2"
            step="0.1"
            className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground"
            onChange={(e) => handleTemperatureChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

PromptLLMNode.displayName = 'PromptLLMNode';

export default PromptLLMNode;
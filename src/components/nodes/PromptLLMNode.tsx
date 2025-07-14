import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Brain } from 'lucide-react';

interface PromptLLMNodeProps {
  data: {
    label?: string;
    model?: string;
    temperature?: number;
  };
  selected?: boolean;
}

const PromptLLMNode = memo(({ data, selected }: PromptLLMNodeProps) => {
  return (
    <div className={`agent-node node-llm ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-white p-4 min-w-[180px]">
        <Brain className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Prompt LLM'}</span>
        <div className="w-full space-y-1">
          <input 
            type="text" 
            placeholder={data.model || 'Model (e.g., gpt-4)'}
            className="w-full px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
            onClick={(e) => e.stopPropagation()}
          />
          <input 
            type="number" 
            placeholder="Temperature"
            min="0"
            max="2"
            step="0.1"
            defaultValue={data.temperature || 0.7}
            className="w-full px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
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
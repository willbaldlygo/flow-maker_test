import { memo, useState, useEffect, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Brain } from 'lucide-react';

interface PromptLLMNodeProps {
  id: string;
  data: {
    label?: string;
  };
  selected?: boolean;
}

const PromptLLMNode = memo(({ id, data, selected }: PromptLLMNodeProps) => {
  return (
    <div className={`agent-node node-llm ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[180px]">
        <Brain className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Prompt LLM'}</span>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '16px',
          height: '16px',
          border: '3px solid hsl(var(--primary))',
          backgroundColor: 'hsl(var(--card))',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '16px',
          height: '16px',
          border: '3px solid hsl(var(--primary))',
          backgroundColor: 'hsl(var(--primary))',
        }}
      />
    </div>
  );
});

PromptLLMNode.displayName = 'PromptLLMNode';

export default PromptLLMNode;

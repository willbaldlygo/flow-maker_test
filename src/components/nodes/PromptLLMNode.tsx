import { memo, useState, useEffect, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Brain } from 'lucide-react';

interface PromptLLMNodeProps {
  id: string;
  data: {
    label?: string;
    promptPrefix?: string;
  };
  selected?: boolean;
}

const PromptLLMNode = memo(({ id, data, selected }: PromptLLMNodeProps) => {
  const { setNodes } = useReactFlow();
  const [prefix, setPrefix] = useState(data.promptPrefix || '');

  const onPrefixChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrefix(evt.target.value);
    },
    [],
  );

  useEffect(() => {
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          node.data = {
            ...node.data,
            promptPrefix: prefix,
          };
        }
        return node;
      }),
    );
  }, [id, prefix, setNodes]);

  return (
    <div className={`agent-node node-llm ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[180px]">
        <Brain className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Prompt LLM'}</span>
        <label className="text-xs font-medium mt-2">Prompt Prefix</label>
        <textarea
          value={prefix}
          onChange={onPrefixChange}
          className="nodrag nowheel w-full text-xs p-1 mt-1 rounded-md bg-background border border-border"
          rows={3}
        />
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

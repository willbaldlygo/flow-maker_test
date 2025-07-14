import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { MessageCircle } from 'lucide-react';

interface UserInputNodeProps {
  id: string;
  data: {
    label?: string;
    placeholder?: string;
    prompt?: string;
  };
  selected?: boolean;
}

const UserInputNode = memo(({ id, data, selected }: UserInputNodeProps) => {
  const { setNodes } = useReactFlow();

  const handlePromptChange = (value: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, prompt: value } }
          : node
      )
    );
  };

  return (
    <div className={`agent-node node-input ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[160px]">
        <MessageCircle className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'User Input'}</span>
        <input 
          type="text" 
          value={data.prompt || ''}
          placeholder={data.placeholder || 'Enter prompt...'}
          className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground"
          onChange={(e) => handlePromptChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

UserInputNode.displayName = 'UserInputNode';

export default UserInputNode;
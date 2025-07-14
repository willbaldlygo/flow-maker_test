import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageCircle } from 'lucide-react';

interface UserInputNodeProps {
  data: {
    label?: string;
    placeholder?: string;
  };
  selected?: boolean;
}

const UserInputNode = memo(({ data, selected }: UserInputNodeProps) => {
  return (
    <div className={`agent-node node-input ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-white p-4 min-w-[160px]">
        <MessageCircle className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'User Input'}</span>
        <input 
          type="text" 
          placeholder={data.placeholder || 'Enter prompt...'}
          className="w-full px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

UserInputNode.displayName = 'UserInputNode';

export default UserInputNode;
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

interface StartNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

const StartNode = memo(({ data, selected }: StartNodeProps) => {
  return (
    <div className={`agent-node node-start ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-white">
        <Play className="w-6 h-6 mb-1" fill="currentColor" />
        <span className="text-xs font-medium">{data.label || 'Start'}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

StartNode.displayName = 'StartNode';

export default StartNode;
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';

interface StopNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

const StopNode = memo(({ data, selected }: StopNodeProps) => {
  return (
    <div className={`agent-node node-stop ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground">
        <Square className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">{data.label || 'Stop'}</span>
      </div>
      <Handle type="target" position={Position.Top} />
    </div>
  );
});

StopNode.displayName = 'StopNode';

export default StopNode;
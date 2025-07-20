import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';

interface StopNodeProps {
  id: string;
  data: {
    label?: string;
  };
  selected?: boolean;
}

const StopNode = memo(({ id, data, selected }: StopNodeProps) => {
  return (
    <div className={`agent-node node-stop ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-primary-foreground">
        <Square className="w-5 h-5 mb-1" />
        <span className="text-sm font-medium">{data.label || 'Stop'}</span>
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
    </div>
  );
});

StopNode.displayName = 'StopNode';

export default StopNode;

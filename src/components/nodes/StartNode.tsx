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
      <div className="node-content flex flex-col items-center justify-center text-primary-foreground">
        <Play className="w-5 h-5 mb-1" />
        <span className="text-sm font-medium">{data.label || 'Start'}</span>
      </div>
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

StartNode.displayName = 'StartNode';

export default StartNode;

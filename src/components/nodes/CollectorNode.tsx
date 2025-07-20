import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Merge } from 'lucide-react';

interface CollectorNodeProps {
  data: {
    label?: string;
    mergeType?: string;
  };
  selected?: boolean;
}

const CollectorNode = memo(({ data, selected }: CollectorNodeProps) => {
  return (
    <div className={`agent-node node-collector ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[140px]" style={{ transform: 'skewX(20deg)' }}>
        <Merge className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium">{data.label || 'Collector'}</span>
        <input 
          type="text" 
          placeholder={data.mergeType || 'Merge logic'}
          className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground"
          onClick={(e) => e.stopPropagation()}
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

CollectorNode.displayName = 'CollectorNode';

export default CollectorNode;

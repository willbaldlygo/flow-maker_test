import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface DecisionNodeProps {
  data: {
    label?: string;
    condition?: string;
  };
  selected?: boolean;
}

const DecisionNode = memo(({ data, selected }: DecisionNodeProps) => {
  return (
    <div className={`agent-node node-decision ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground text-center">
        <GitBranch className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium">{data.label || 'Decision'}</span>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          width: '16px',
          height: '16px',
          left: '0%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          border: '3px solid hsl(var(--primary))',
          backgroundColor: 'hsl(var(--card))',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{
          width: '12px',
          height: '12px',
          right: '0%',
          top: '50%',
          transform: 'translate(50%, -50%)',
          border: '2px solid hsl(var(--primary))',
          backgroundColor: 'hsl(var(--primary))',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{
          width: '12px',
          height: '12px',
          left: '50%',
          bottom: '0%',
          transform: 'translate(-50%, 50%)',
          border: '2px solid hsl(var(--primary))',
          backgroundColor: 'hsl(var(--primary))',
        }}
      />
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';

export default DecisionNode;

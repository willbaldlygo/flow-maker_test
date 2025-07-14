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
      <div className="node-content flex flex-col items-center justify-center text-white text-center">
        <GitBranch className="w-4 h-4 mb-1" />
        <span className="text-xs font-medium">{data.label || 'Decision'}</span>
      </div>
      <Handle type="target" position={Position.Left} style={{ transform: 'rotate(-45deg)', left: '-6px', top: '50%' }} />
      <Handle type="source" position={Position.Top} id="true" style={{ transform: 'rotate(-45deg)', left: '50%', top: '-6px' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ transform: 'rotate(-45deg)', left: '50%', bottom: '-6px' }} />
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';

export default DecisionNode;
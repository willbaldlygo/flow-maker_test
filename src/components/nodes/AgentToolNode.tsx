import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Wrench } from 'lucide-react';

interface AgentToolNodeProps {
  data: {
    label?: string;
    toolType?: string;
    config?: string;
  };
  selected?: boolean;
}

const AgentToolNode = memo(({ data, selected }: AgentToolNodeProps) => {
  return (
    <div className={`agent-node node-tool ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-white p-4 min-w-[160px]">
        <Wrench className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Agent Tool'}</span>
        <div className="w-full space-y-1">
          <input 
            type="text" 
            placeholder={data.toolType || 'Tool type'}
            className="w-full px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
            onClick={(e) => e.stopPropagation()}
          />
          <input 
            type="text" 
            placeholder={data.config || 'Configuration'}
            className="w-full px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

AgentToolNode.displayName = 'AgentToolNode';

export default AgentToolNode;
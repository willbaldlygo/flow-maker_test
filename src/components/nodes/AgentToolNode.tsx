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
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[160px]">
        <Wrench className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Agent Tool'}</span>
        <div className="w-full space-y-1">
          <input 
            type="text" 
            placeholder={data.toolType || 'Tool type'}
            className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          />
          <input 
            type="text" 
            placeholder={data.config || 'Configuration'}
            className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="input"
        style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '0', 
          transform: 'rotate(45deg)',
          backgroundColor: 'white',
          border: '2px solid var(--handle-border-color-default)',
          left: '-6px',
          top: '50%',
          marginTop: '-6px'
        }} 
      />
    </div>
  );
});

AgentToolNode.displayName = 'AgentToolNode';

export default AgentToolNode;
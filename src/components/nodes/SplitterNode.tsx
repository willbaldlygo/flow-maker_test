import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Split } from 'lucide-react';

interface SplitterNodeProps {
  data: {
    label?: string;
    splitType?: string;
  };
  selected?: boolean;
}

const SplitterNode = memo(({ data, selected }: SplitterNodeProps) => {
  return (
    <div className={`agent-node node-splitter ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-white p-4 min-w-[140px]" style={{ transform: 'skewX(20deg)' }}>
        <Split className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Splitter'}</span>
        <input 
          type="text" 
          placeholder={data.splitType || 'Split logic'}
          className="w-full px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} id="output1" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Right} id="output2" style={{ top: '70%' }} />
    </div>
  );
});

SplitterNode.displayName = 'SplitterNode';

export default SplitterNode;
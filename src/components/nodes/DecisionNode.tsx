import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { Textarea } from '../ui/textarea';

interface DecisionNodeProps {
  id: string;
  data: {
    label?: string;
    question?: string;
  };
  selected?: boolean;
}

const DecisionNode = memo(({ id, data, selected }: DecisionNodeProps) => {
  const { setNodes } = useReactFlow();
  const size = 240;
  const halfSize = size / 2;
  const strokeWidth = 2;
  const path = `M ${halfSize},${strokeWidth} L ${size - strokeWidth},${halfSize} L ${halfSize},${size - strokeWidth} L ${strokeWidth},${halfSize} Z`;

  const onChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newQuestion = evt.target.value;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                question: newQuestion,
              },
            };
          }
          return node;
        }),
      );
    },
    [id, setNodes],
  );

  return (
    <div
      className={`relative ${selected ? 'selected' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute"
      >
        <path
          d={path}
          fill="hsl(var(--card))"
          stroke="hsl(var(--node-decision))"
          strokeWidth={strokeWidth}
        />
        {selected && (
          <path
            d={path}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth * 2}
            className="glow-path"
          />
        )}
      </svg>
      <div className="relative flex flex-col items-center justify-center h-full text-foreground p-5">
        <div className="flex items-center mb-2">
          <GitBranch className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">{data.label || 'Decision'}</span>
        </div>
        <Textarea
          className="nodrag nowheel text-sm text-center bg-transparent border-none focus:outline-none"
          value={data.question || ''}
          onChange={onChange}
          placeholder="Condition..."
          data-id="question"
          style={{ resize: 'none' }}
        />
      </div>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{
          width: '16px',
          height: '16px',
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
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{
          width: '12px',
          height: '12px',
        }}
      />
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';

export default DecisionNode;

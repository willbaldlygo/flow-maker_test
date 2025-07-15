import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Bot } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PromptAgentNodeProps {
  id: string;
  data: {
    label?: string;
    llm?: string;
    systemPrompt?: string;
  };
  selected?: boolean;
}

const PromptAgentNode = memo(({ id, data, selected }: PromptAgentNodeProps) => {
  const { setNodes } = useReactFlow();

  const handleLLMChange = (value: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, llm: value } }
          : node
      )
    );
  };

  const handleSystemPromptChange = (value: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, systemPrompt: value } }
          : node
      )
    );
  };

  return (
    <div className={`agent-node node-agent ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[180px]">
        <Bot className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Prompt Agent'}</span>
        <div className="w-full space-y-1">
          <Select value={data.llm || ''} onValueChange={handleLLMChange}>
            <SelectTrigger 
              className="w-full h-7 text-xs bg-muted border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue placeholder="Select LLM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="claude-sonnet">Claude Sonnet</SelectItem>
              <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
            </SelectContent>
          </Select>
          <textarea 
            value={data.systemPrompt || ''}
            placeholder="System prompt..."
            rows={2}
            className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground resize-none"
            onChange={(e) => handleSystemPromptChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '0', 
          transform: 'rotate(45deg)',
          backgroundColor: 'var(--handle-background-color-default)',
          border: '1px solid var(--handle-border-color-default)'
        }} 
      />
    </div>
  );
});

PromptAgentNode.displayName = 'PromptAgentNode';

export default PromptAgentNode;
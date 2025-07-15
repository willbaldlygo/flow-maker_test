import { memo, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Bot } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrompt, setTempPrompt] = useState('');

  const defaultPrompt = "You are a helpful agent who takes ${input} and does something with it";

  useEffect(() => {
    if (!data.systemPrompt) {
      handleSystemPromptChange(defaultPrompt);
    }
  }, []);

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempPrompt(data.systemPrompt || defaultPrompt);
  };

  const handleSave = () => {
    handleSystemPromptChange(tempPrompt);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempPrompt(data.systemPrompt || defaultPrompt);
    setIsEditing(false);
  };

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
    <div className={`agent-node node-agent ${selected ? 'selected' : ''} ${isEditing ? 'z-50' : ''}`}>
      <div 
        className={`node-content flex flex-col items-center justify-center text-foreground p-4 transition-all duration-300 ${isEditing ? 'min-w-[400px] min-h-[300px]' : 'min-w-[180px] max-w-[200px]'}`}
        onClick={!isEditing ? handleNodeClick : undefined}
      >
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
          {isEditing ? (
            <div className="space-y-2">
              <textarea 
                value={tempPrompt}
                placeholder="System prompt..."
                rows={8}
                className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder-muted-foreground overflow-y-auto"
                onChange={(e) => setTempPrompt(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  className="text-xs h-6"
                >
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancel}
                  className="text-xs h-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground min-h-[40px] cursor-pointer overflow-hidden"
              onClick={handleNodeClick}
            >
              <div className="line-clamp-2">
                {data.systemPrompt || defaultPrompt}
              </div>
            </div>
          )}
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '0', 
          transform: 'rotate(45deg)',
          backgroundColor: 'var(--handle-background-color-default)',
          border: '1px solid var(--handle-border-color-default)',
          right: '-6px',
          top: '50%',
          marginTop: '-6px'
        }} 
      />
    </div>
  );
});

PromptAgentNode.displayName = 'PromptAgentNode';

export default PromptAgentNode;
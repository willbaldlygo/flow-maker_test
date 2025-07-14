import { memo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Play, 
  Square, 
  MessageCircle, 
  Brain, 
  Bot, 
  Wrench, 
  Split, 
  Merge, 
  GitBranch 
} from 'lucide-react';

interface NodeTemplate {
  type: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'start',
    label: 'Start',
    icon: Play,
    description: 'Entry point for the agent flow'
  },
  {
    type: 'stop',
    label: 'Stop',
    icon: Square,
    description: 'End point for the agent flow'
  },
  {
    type: 'userInput',
    label: 'User Input',
    icon: MessageCircle,
    description: 'Capture user input or prompts'
  },
  {
    type: 'promptLLM',
    label: 'Prompt LLM',
    icon: Brain,
    description: 'Send prompts to language models'
  },
  {
    type: 'promptAgent',
    label: 'Prompt Agent',
    icon: Bot,
    description: 'Configure and prompt AI agents'
  },
  {
    type: 'agentTool',
    label: 'Agent Tool',
    icon: Wrench,
    description: 'Tools and functions for agents'
  },
  {
    type: 'splitter',
    label: 'Splitter',
    icon: Split,
    description: 'Split flow into multiple paths'
  },
  {
    type: 'collector',
    label: 'Collector',
    icon: Merge,
    description: 'Merge multiple flows together'
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: GitBranch,
    description: 'Conditional branching logic'
  }
];

interface AgentBuilderSidebarProps {
  onAddNode: (type: string) => void;
}

const AgentBuilderSidebar = memo(({ onAddNode }: AgentBuilderSidebarProps) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-80 bg-card border-r border-border p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Agent Builder</h2>
        <p className="text-sm text-muted-foreground">
          Drag and drop components to build your LlamaIndex agent flow
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">Components</h3>
        {nodeTemplates.map((template) => {
          const IconComponent = template.icon;
          return (
            <Card
              key={template.type}
              className="p-3 cursor-grab active:cursor-grabbing border-border hover:border-primary/50 transition-colors"
              draggable
              onDragStart={(e) => onDragStart(e, template.type)}
              onClick={() => onAddNode(template.type)}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconComponent className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {template.label}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-medium text-foreground mb-2">Quick Actions</h4>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => onAddNode('start')}
          >
            <Play className="w-4 h-4 mr-2" />
            Add Start Node
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => onAddNode('userInput')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Add User Input
          </Button>
        </div>
      </div>
    </div>
  );
});

AgentBuilderSidebar.displayName = 'AgentBuilderSidebar';

export default AgentBuilderSidebar;
import { memo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { 
  Play, 
  Square, 
  MessageCircle, 
  Brain, 
  Bot, 
  Wrench, 
  Split, 
  Merge, 
  GitBranch,
  Trash2,
  AlertTriangle,
  Settings,
  Blocks
} from 'lucide-react';
import AgentBuilderSettings from './AgentBuilderSettings';
import { SettingsData } from './AgentBuilderSettings';

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
  onReset: () => void;
  settings: SettingsData;
  onUpdateSettings: (settings: SettingsData) => void;
}

const AgentBuilderSidebar = memo(({ onAddNode, onReset, settings, onUpdateSettings }: AgentBuilderSidebarProps) => {
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

      <Accordion type="multiple" defaultValue={["components", "settings"]} className="w-full">
        {/* Components Section */}
        <AccordionItem value="components">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center space-x-2">
              <Blocks className="w-4 h-4 text-primary" />
              <span>Components</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {nodeTemplates.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Card
                    key={template.type}
                    className="p-2 cursor-grab active:cursor-grabbing border-border hover:border-primary/50 transition-colors"
                    draggable
                    onDragStart={(e) => onDragStart(e, template.type)}
                    onClick={() => onAddNode(template.type)}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0">
                        <IconComponent className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {template.label}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-tight">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Settings Section */}
        <AccordionItem value="settings">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-primary" />
              <span>Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <AgentBuilderSettings settings={settings} onUpdateSettings={onUpdateSettings} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Danger Zone Section */}
        <AccordionItem value="danger-zone">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span>Danger Zone</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <Card className="p-3 border-destructive/20 bg-destructive/5">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    This will permanently delete all nodes, connections, and settings.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onReset}
                    className="w-full"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Reset Everything
                  </Button>
                </div>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
});

AgentBuilderSidebar.displayName = 'AgentBuilderSidebar';

export default AgentBuilderSidebar;
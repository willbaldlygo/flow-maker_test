import { memo } from 'react';
import {
  Card,
} from "@/components/ui/card"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import { Settings, Trash2, FileJson, Blocks, MessageCircle, Brain, Bot, Wrench, Split, Merge, GitBranch, Play, Square, AlertTriangle } from 'lucide-react';
import AgentBuilderSettings, { SettingsData } from './AgentBuilderSettings';

interface NodeTemplateProps {
    type: string;
    label: string;
    description: string;
    icon: React.ElementType;
    onAddNode: (type: string) => void;
  }
  
  const NodeTemplate = memo(({ type, label, description, icon: Icon, onAddNode }: NodeTemplateProps) => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    };
  
    return (
        <Card
        className="p-2 cursor-grab active:cursor-grabbing border-border hover:border-primary/50 transition-colors"
        draggable
        onDragStart={(e) => onDragStart(e, type)}
        onClick={() => onAddNode(type)}
      >
        <div className="flex items-start space-x-2">
          <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground truncate">
              {label}
            </h4>
            <p className="text-xs text-muted-foreground leading-tight">
              {description}
            </p>
          </div>
        </div>
      </Card>
    );
  });
  NodeTemplate.displayName = 'NodeTemplate';

interface AgentBuilderSidebarProps {
  onAddNode: (type: string) => void;
  onReset: () => void;
  settings: SettingsData;
  onUpdateSettings: (settings: SettingsData) => void;
}

const nodeTemplates = [
    { type: 'start', label: 'Start', description: 'Entry point for the agent flow', icon: Play },
    { type: 'stop', label: 'Stop', description: 'End point for the agent flow', icon: Square },
    { type: 'userInput', label: 'User Input', description: 'Capture user input or prompts', icon: MessageCircle },
    { type: 'promptLLM', label: 'Prompt LLM', description: 'Send prompts to language models', icon: Brain },
    { type: 'promptAgent', label: 'Prompt Agent', description: 'Configure and prompt AI agents', icon: Bot },
    { type: 'agentTool', label: 'Agent Tool', description: 'Tools and functions for agents', icon: Wrench },
    { type: 'decision', label: 'Decision', description: 'Conditional branching logic', icon: GitBranch },
    { type: 'splitter', label: 'Splitter', description: 'Split flow into multiple paths', icon: Split },
    { type: 'collector', label: 'Collector', description: 'Merge multiple flows together', icon: Merge },
  ];

const AgentBuilderSidebar = ({ onAddNode, onReset, settings, onUpdateSettings }: AgentBuilderSidebarProps) => {

  return (
    <aside className="w-80 bg-card border-r border-border p-4 flex flex-col space-y-4">
      <h2 className="text-xl font-semibold">Agent Builder</h2>
      
      <div className="flex-grow overflow-y-auto">
        <Accordion type="multiple" defaultValue={['nodes', 'settings']} className="w-full">
          <AccordionItem value="nodes">
            <AccordionTrigger className="text-base font-medium">
              <Blocks className="mr-2 h-4 w-4" /> Nodes
            </AccordionTrigger>
            <AccordionContent className="p-2 space-y-2">
              {nodeTemplates.map((template) => (
                <NodeTemplate key={template.type} {...template} onAddNode={onAddNode} />
              ))}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="settings">
            <AccordionTrigger className="text-base font-medium">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </AccordionTrigger>
            <AccordionContent>
                <AgentBuilderSettings settings={settings} onUpdateSettings={onUpdateSettings} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="danger-zone">
            <AccordionTrigger className="text-base font-medium text-destructive">
              <AlertTriangle className="mr-2 h-4 w-4" /> Danger Zone
            </AccordionTrigger>
            <AccordionContent className="p-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                    This will permanently delete all nodes, connections, and settings.
                </p>
                <Button variant="destructive" onClick={onReset} className="w-full justify-start">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Reset Everything
                </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      <div className="flex-shrink-0 space-y-2">
      </div>
    </aside>
  );
};

export default AgentBuilderSidebar;

import { memo, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Wrench } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface AgentToolNodeProps {
  id: string;
  data: {
    label?: string;
    toolType?: string;
    config?: string;
  };
  selected?: boolean;
}

interface LlamaCloudProject {
  id: string;
  name: string;
}

interface LlamaCloudPipeline {
  id: string;
  name: string;
}

const AgentToolNode = memo(({ id, data, selected }: AgentToolNodeProps) => {
  const { setNodes } = useReactFlow();
  const [toolType, setToolType] = useState<string>(data.toolType || '');
  const [selectedIndex, setSelectedIndex] = useState<string>(data.config || '');
  const [toolName, setToolName] = useState<string>('');
  const [toolDescription, setToolDescription] = useState<string>('');
  const [pipelines, setPipelines] = useState<LlamaCloudPipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  
  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(`agent-tool-config-${id}`);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setToolType(config.toolType || '');
        setSelectedIndex(config.selectedIndex || '');
        setToolName(config.name || '');
        setToolDescription(config.description || '');
      }
      setConfigLoaded(true);
    } catch (error) {
      console.error('Error loading agent tool config:', error);
      setConfigLoaded(true);
    }
  }, [id]);

  // Save configuration to localStorage and update node data whenever config state changes
  useEffect(() => {
    if (!configLoaded) return;
    try {
      const config = {
        toolType,
        selectedIndex,
        name: toolName,
        description: toolDescription,
      };

      // Save to localStorage
      localStorage.setItem(`agent-tool-config-${id}`, JSON.stringify(config));

      // Update node data in the flow graph
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  toolType,
                  config: selectedIndex,
                  name: toolName,
                  description: toolDescription,
                },
              }
            : node
        )
      );
    } catch (error) {
      console.error('Error saving agent tool config:', error);
    }
  }, [toolType, selectedIndex, toolName, toolDescription, id, setNodes, configLoaded]);
  

  const fetchLlamaCloudData = async () => {
    if (toolType !== 'llamacloud-index') return;
    
    setLoading(true);
    try {
      // First, get the current project
      const projectResponse = await fetch('/api/llamacloud/v1/projects/current', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!projectResponse.ok) {
        throw new Error(`Failed to fetch project: ${await projectResponse.text()}`);
      }
      
      const projectData: LlamaCloudProject = await projectResponse.json();
      
      // Then, get the pipelines for this project
      const pipelinesResponse = await fetch(`/api/llamacloud/v1/pipelines?projectId=${projectData.id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!pipelinesResponse.ok) {
        throw new Error(`Failed to fetch pipelines: ${await pipelinesResponse.text()}`);
      }
      
      const pipelinesData: LlamaCloudPipeline[] = await pipelinesResponse.json();
      setPipelines(pipelinesData);
    } catch (error) {
      console.error('Error fetching LlamaCloud data:', error);
      setPipelines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLlamaCloudData();
  }, [toolType]);

  // Handle tool type change
  const handleToolTypeChange = (newToolType: string) => {
    setToolType(newToolType);
  };

  // Handle index selection change
  const handleIndexChange = (newIndex: string) => {
    setSelectedIndex(newIndex);
  };

  return (
    <div className={`agent-node node-tool ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[160px]">
        <Wrench className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Agent Tool'}</span>
        <div className="w-full space-y-2">
          <Select value={toolType} onValueChange={handleToolTypeChange}>
            <SelectTrigger className="w-full h-7 text-xs">
              <SelectValue placeholder="Select tool type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="llamacloud-index">LlamaCloud Index</SelectItem>
            </SelectContent>
          </Select>
          
          {toolType === 'llamacloud-index' && (
            <>
              <Input
                type="text"
                placeholder="Tool Name"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="w-full h-7 text-xs"
              />
              <Textarea
                placeholder="Tool Description"
                value={toolDescription}
                onChange={(e) => setToolDescription(e.target.value)}
                className="w-full text-xs"
                rows={3}
              />
              <Select 
                value={pipelines.length > 0 ? selectedIndex : ""} 
                onValueChange={handleIndexChange} 
                disabled={loading}
              >
                <SelectTrigger className="w-full h-7 text-xs">
                  <SelectValue placeholder={
                    loading ? "Loading..." : 
                    pipelines.length === 0 ? "No indexes found" :
                    "Select index"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          )}
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
          border: '2px solid hsl(var(--node-tool))',
          left: '-6px',
        }} 
      />
    </div>
  );
});

AgentToolNode.displayName = 'AgentToolNode';

export default AgentToolNode;

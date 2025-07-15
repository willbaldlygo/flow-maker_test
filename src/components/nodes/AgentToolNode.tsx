import { memo, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Wrench } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
  const [pipelines, setPipelines] = useState<LlamaCloudPipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  
  // Load API key from settings
  const loadApiKey = () => {
    try {
      const savedSettings = localStorage.getItem('agent-builder-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.llamaCloudApiKey || '';
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return '';
  };
  
  // Load API key on mount and when settings change
  useEffect(() => {
    const key = loadApiKey();
    setApiKey(key);
    
    // Listen for settings changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'agent-builder-settings') {
        const key = loadApiKey();
        setApiKey(key);
      }
    };
    
    // Check for API key changes periodically (for same-tab changes)
    const checkApiKey = () => {
      const currentKey = loadApiKey();
      if (currentKey !== apiKey) {
        setApiKey(currentKey);
      }
    };
    
    const interval = setInterval(checkApiKey, 1000); // Check every second
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [apiKey]);
  
  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(`agent-tool-config-${id}`);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setToolType(config.toolType || '');
        setSelectedIndex(config.selectedIndex || '');
        console.log('Loaded config from localStorage:', config);
      }
      setConfigLoaded(true);
    } catch (error) {
      console.error('Error loading agent tool config:', error);
      setConfigLoaded(true);
    }
  }, [id]);
  
  // Save configuration to localStorage and update node data
  const saveConfig = (newToolType: string, newSelectedIndex: string) => {
    try {
      const config = {
        toolType: newToolType,
        selectedIndex: newSelectedIndex
      };
      
      console.log('Saving config to localStorage:', config);
      
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
                  toolType: newToolType,
                  config: newSelectedIndex
                }
              }
            : node
        )
      );
    } catch (error) {
      console.error('Error saving agent tool config:', error);
    }
  };
  

  const fetchLlamaCloudData = async () => {
    if (!apiKey || toolType !== 'llamacloud-index') return;
    
    setLoading(true);
    try {
      // First, get the current project
      const projectResponse = await fetch('/api/llamacloud/api/v1/projects/current', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project');
      }
      
      const projectData: LlamaCloudProject = await projectResponse.json();
      
      // Then, get the pipelines for this project
      const pipelinesResponse = await fetch(`/api/llamacloud/api/v1/pipelines?project_id=${projectData.id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!pipelinesResponse.ok) {
        throw new Error('Failed to fetch pipelines');
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
  }, [toolType, apiKey]);

  // Ensure selectedIndex is preserved after pipelines are loaded
  useEffect(() => {
    console.log('Pipelines loaded:', pipelines.length, 'Current selectedIndex:', selectedIndex);
    if (pipelines.length > 0 && selectedIndex) {
      const foundPipeline = pipelines.find(p => p.id === selectedIndex);
      console.log('Found pipeline for selectedIndex:', foundPipeline);
    }
  }, [pipelines, selectedIndex]);

  // Handle tool type change
  const handleToolTypeChange = (newToolType: string) => {
    setToolType(newToolType);
    saveConfig(newToolType, selectedIndex);
  };

  // Handle index selection change
  const handleIndexChange = (newIndex: string) => {
    setSelectedIndex(newIndex);
    saveConfig(toolType, newIndex);
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
            <Select 
              value={pipelines.length > 0 ? selectedIndex : ""} 
              onValueChange={handleIndexChange} 
              disabled={loading || !apiKey}
            >
              <SelectTrigger className="w-full h-7 text-xs">
                <SelectValue placeholder={
                  loading ? "Loading..." : 
                  !apiKey ? "No API key configured" : 
                  pipelines.length === 0 ? "No indexes found" :
                  "Select index"
                } />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
import { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Wrench } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AgentToolNodeProps {
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

const AgentToolNode = memo(({ data, selected }: AgentToolNodeProps) => {
  const [toolType, setToolType] = useState<string>(data.toolType || '');
  const [selectedIndex, setSelectedIndex] = useState<string>(data.config || '');
  const [pipelines, setPipelines] = useState<LlamaCloudPipeline[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Mock API key - in a real app this would come from settings/env
  const apiKey = localStorage.getItem('llamacloud_api_key');

  const fetchLlamaCloudData = async () => {
    if (!apiKey || toolType !== 'llamacloud-index') return;
    
    setLoading(true);
    try {
      // First, get the current project
      const projectResponse = await fetch('https://api.cloud.llamaindex.ai/api/v1/projects/current', {
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
      const pipelinesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines?project_id=${projectData.id}`, {
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

  return (
    <div className={`agent-node node-tool ${selected ? 'selected' : ''}`}>
      <div className="node-content flex flex-col items-center justify-center text-foreground p-4 min-w-[160px]">
        <Wrench className="w-5 h-5 mb-2" />
        <span className="text-sm font-medium mb-2">{data.label || 'Agent Tool'}</span>
        <div className="w-full space-y-2">
          <Select value={toolType} onValueChange={setToolType}>
            <SelectTrigger className="w-full h-7 text-xs">
              <SelectValue placeholder="Select tool type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="llamacloud-index">LlamaCloud Index</SelectItem>
            </SelectContent>
          </Select>
          
          {toolType === 'llamacloud-index' && (
            <Select value={selectedIndex} onValueChange={setSelectedIndex} disabled={loading || !apiKey}>
              <SelectTrigger className="w-full h-7 text-xs">
                <SelectValue placeholder={
                  loading ? "Loading..." : 
                  !apiKey ? "No API key configured" : 
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
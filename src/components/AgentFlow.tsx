import '@xyflow/react/dist/style.css';
import { useCallback, useRef, useState, useEffect, Dispatch, SetStateAction, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  OnNodesChange,
  OnEdgesChange,
  NodeProps,
} from '@xyflow/react';

// Import custom nodes
import StartNode from './nodes/StartNode';
import StopNode from './nodes/StopNode';
import UserInputNode from './nodes/UserInputNode';
import PromptLLMNode from './nodes/PromptLLMNode';
import PromptAgentNode from './nodes/PromptAgentNode';
import AgentToolNode from './nodes/AgentToolNode';
import SplitterNode from './nodes/SplitterNode';
import CollectorNode from './nodes/CollectorNode';
import DecisionNode from './nodes/DecisionNode';
import { Save, Check } from 'lucide-react';
import AgentBuilderSidebar from './AgentBuilderSidebar';
import { SettingsData, defaultSettings } from './AgentBuilderSettings';

// Node types mapping
const nodeTypes = {
  start: StartNode,
  stop: StopNode,
  userInput: UserInputNode,
  promptLLM: PromptLLMNode,
  promptAgent: PromptAgentNode,
  agentTool: AgentToolNode,
  splitter: SplitterNode,
  collector: CollectorNode,
  decision: DecisionNode,
};

interface AgentFlowInnerProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    setNodes: Dispatch<SetStateAction<Node[]>>;
    setEdges: Dispatch<SetStateAction<Edge[]>>;
    settings: SettingsData;
    setSettings: Dispatch<SetStateAction<SettingsData>>;
}

const AgentFlowInner = ({ nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, settings, setSettings }: AgentFlowInnerProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const { screenToFlowPosition } = useReactFlow();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // onUpdateSettings sets the settings
  const onUpdateSettings = (newSettings: SettingsData) => {
    setSettings(newSettings);
  };

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('agent-builder-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  // Generate unique node ID based on existing nodes
  const generateNodeId = useCallback(() => {
    const existingIds = nodes.map(node => parseInt(node.id)).filter(id => !isNaN(id));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return (maxId + 1).toString();
  }, [nodes]);

  // Auto-save to localStorage whenever nodes or edges change
  useEffect(() => {
    const saveGraph = async () => {
      try {
        setIsSaving(true);
        localStorage.setItem('agent-builder-nodes', JSON.stringify(nodes));
        localStorage.setItem('agent-builder-edges', JSON.stringify(edges));
        
        // Show saving indicator briefly
        setTimeout(() => setIsSaving(false), 500);
      } catch (error) {
        console.error('Error saving graph:', error);
        setIsSaving(false);
      }
    };

    // Debounce saves to avoid too frequent localStorage writes
    const timeoutId = setTimeout(saveGraph, 300);
    
    return () => clearTimeout(timeoutId);
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(node => node.id === params.source);
      let label;
      if (sourceNode?.type === 'decision') {
        if (params.sourceHandle === 'true') {
          label = 'True';
        } else if (params.sourceHandle === 'false') {
          label = 'False';
        }
      }

      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'smoothstep',
        animated: false,
        label,
        style: {
          strokeWidth: 2,
          stroke: 'hsl(var(--muted-foreground))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, nodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: generateNodeId(),
        type,
        position,
        data: { 
          label: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1').trim()
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, generateNodeId]
  );

  const onAddNode = useCallback((type: string) => {
    const position = { x: Math.random() * 400 + 200, y: Math.random() * 400 + 200 };
    const newNode: Node = {
      id: generateNodeId(),
      type,
      position,
      data: { 
        label: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1').trim()
      }
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, generateNodeId]);

  const onReset = useCallback(() => {
    // Clear the graph
    setNodes([]);
    setEdges([]);
    
    // Reset settings to default
    setSettings(defaultSettings);
    
    // Clear localStorage
    localStorage.removeItem('agent-builder-nodes');
    localStorage.removeItem('agent-builder-edges');
    localStorage.removeItem('agent-builder-settings');
    
    // Clear all agent tool configurations
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('agent-tool-config-')) {
        localStorage.removeItem(key);
      }
    });
  }, [setNodes, setEdges]);

  return (
    <div className="h-full flex relative">
      {/* Save Indicator */}
      <div className="absolute top-4 right-4 z-50 flex items-center space-x-2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        {isSaving ? (
          <>
            <Save className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Saving...</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Saved</span>
          </>
        )}
      </div>

      <AgentBuilderSidebar onAddNode={onAddNode} onReset={onReset} settings={settings} onUpdateSettings={onUpdateSettings} />
      
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          proOptions={{ hideAttribution: true }}
          className="bg-flow-bg"
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            style: {
              strokeWidth: 2,
              stroke: 'hsl(var(--muted-foreground))'
            }
          }}
        >
          <Background color="hsl(var(--border))" gap={20} />
          <Controls />
          <MiniMap 
            zoomable 
            pannable 
            className="bg-card border border-border"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

interface AgentFlowProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    setNodes: Dispatch<SetStateAction<Node[]>>;
    setEdges: Dispatch<SetStateAction<Edge[]>>;
    settings: SettingsData;
    setSettings: Dispatch<SetStateAction<SettingsData>>;
}

const AgentFlow = ({ nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, settings, setSettings }: AgentFlowProps) => {
    return (
      <ReactFlowProvider>
        <AgentFlowInner nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} setNodes={setNodes} setEdges={setEdges} settings={settings} setSettings={setSettings} />
      </ReactFlowProvider>
    );
  };
  
  export default AgentFlow;
  
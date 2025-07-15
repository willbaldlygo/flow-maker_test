import '@xyflow/react/dist/style.css';
import { useCallback, useRef, useState, useEffect } from 'react';
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
  ReactFlowProvider
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

// Initial nodes and edges
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'start',
    position: { x: 100, y: 200 },
    data: { label: 'Start' }
  }
];

const initialEdges: Edge[] = [];

// Load saved graph from localStorage
const loadSavedGraph = () => {
  try {
    const savedNodes = localStorage.getItem('agent-builder-nodes');
    const savedEdges = localStorage.getItem('agent-builder-edges');
    
    if (savedNodes && savedEdges) {
      return {
        nodes: JSON.parse(savedNodes),
        edges: JSON.parse(savedEdges)
      };
    }
  } catch (error) {
    console.error('Error loading saved graph:', error);
  }
  
  return {
    nodes: initialNodes,
    edges: initialEdges
  };
};

const savedGraph = loadSavedGraph();

const AgentFlowInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(savedGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(savedGraph.edges);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('agent-builder-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

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

  // Handle delete key presses
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Delete selected nodes
        setNodes((nds) => nds.filter((node) => !node.selected));
        // Delete selected edges
        setEdges((eds) => eds.filter((edge) => !edge.selected));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setNodes, setEdges]);

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
      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'default',
        animated: false,
        style: {
          strokeWidth: 2,
          stroke: 'hsl(var(--muted-foreground))'
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
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
  }, [setNodes, setEdges]);

  return (
    <div className="h-screen flex relative">
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

      <AgentBuilderSidebar onAddNode={onAddNode} onReset={onReset} settings={settings} onUpdateSettings={setSettings} />
      
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-flow-bg"
          defaultEdgeOptions={{
            type: 'default',
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

const AgentFlow = () => {
  return (
    <ReactFlowProvider>
      <AgentFlowInner />
    </ReactFlowProvider>
  );
};

export default AgentFlow;
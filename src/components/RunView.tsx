import '@xyflow/react/dist/style.css';
import { useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ReactFlowProvider
} from '@xyflow/react';

// Import custom nodes (read-only versions)
import StartNode from './nodes/StartNode';
import StopNode from './nodes/StopNode';
import UserInputNode from './nodes/UserInputNode';
import PromptLLMNode from './nodes/PromptLLMNode';
import PromptAgentNode from './nodes/PromptAgentNode';
import AgentToolNode from './nodes/AgentToolNode';
import SplitterNode from './nodes/SplitterNode';
import CollectorNode from './nodes/CollectorNode';
import DecisionNode from './nodes/DecisionNode';
import RunSidebar from './RunSidebar';

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
    nodes: [],
    edges: []
  };
};

const RunViewInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load the saved graph on mount
  useEffect(() => {
    const savedGraph = loadSavedGraph();
    setNodes(savedGraph.nodes);
    setEdges(savedGraph.edges);
  }, [setNodes, setEdges]);

  return (
    <div className="h-full flex relative">
      <RunSidebar />
      
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
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

const RunView = () => {
  return (
    <ReactFlowProvider>
      <RunViewInner />
    </ReactFlowProvider>
  );
};

export default RunView;
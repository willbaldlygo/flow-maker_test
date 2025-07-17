import '@xyflow/react/dist/style.css';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import { type Message } from 'ai/react';
import { compileWorkflow } from '@/lib/workflow-compiler';
import { useRef, useState, useEffect } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  ChatInput,
  ChatMessages,
  ChatSection,
  ChatHandler,
  Message as ChatUIMessage,
} from '@llamaindex/chat-ui';

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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [workflowState, _setWorkflowState] = useState<Record<string, any>>({});
  const workflowStateRef = useRef(workflowState);

  const setWorkflowState = (data: React.SetStateAction<Record<string, any>>) => {
    const value =
      typeof data === 'function' ? data(workflowStateRef.current) : data;
    workflowStateRef.current = value;
    _setWorkflowState(value);
  };

  const [executionStatus, setExecutionStatus] = useState<
    'idle' | 'running' | 'pausedForInput' | 'finished' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const chatHandler: ChatHandler = {
    messages: messages as ChatUIMessage[],
    input,
    setInput,
    isLoading:
      executionStatus === 'running' || executionStatus === 'finished',
    append: async (message) => {
      const newMessage = {
        ...message,
        id: Math.random().toString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      await handleUserInput(newMessage);
      return '';
    },
    reload: () => {},
    stop: () => {},
  };

  // Load the saved graph on mount
  useEffect(() => {
    const savedGraph = loadSavedGraph();
    setNodes(savedGraph.nodes);
    setEdges(savedGraph.edges);
  }, [setNodes, setEdges]);

  const executeNode = async (nodeId: string) => {
    setCurrentNodeId(nodeId);
    const node = nodes.find((n) => n.id === nodeId);

    if (!node) {
      setError(`Node with ID ${nodeId} not found.`);
      setExecutionStatus('error');
      return;
    }

    try {
      let nextNodeId: string | null = null;
      switch (node.type) {
        case 'start':
          const connectedEdge = edges.find((e) => e.source === nodeId);
          if (connectedEdge) {
            nextNodeId = connectedEdge.target;
          } else {
            setExecutionStatus('finished');
          }
          break;
        case 'userInput':
          setExecutionStatus('pausedForInput');
          // The workflow will now wait for user input.
          // The onUserInput function will be called when the user submits a message.
          return; // Don't proceed further until user input
        case 'promptLLM':
          // This will be handled similarly to promptAgent
          const llmOutput = `Mock output from ${node.data.label}`;
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              role: 'assistant',
              content: `Executing ${node.data.label}...`,
            },
          ]);
          setWorkflowState((prevState) => ({
            ...prevState,
            [nodeId]: llmOutput,
          }));
          const llmEdge = edges.find((e) => e.source === nodeId);
          if (llmEdge) {
            nextNodeId = llmEdge.target;
          } else {
            setExecutionStatus('finished');
          }
          break;
        case 'promptAgent':
          const compiledWorkflow = compileWorkflow(nodes, edges);
          const response = await fetch('/api/agent/run', {
            method: 'POST',
            body: JSON.stringify({
              workflow: compiledWorkflow.nodes,
              settings: compiledWorkflow.settings,
              workflowState: workflowStateRef.current,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(
              `Agent execution failed: ${await response.text()}`,
            );
          }

          const { output } = await response.json();

          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              role: 'assistant',
              content: output,
            },
          ]);

          setWorkflowState((prevState) => ({
            ...prevState,
            [nodeId]: output,
          }));

          const agentEdge = edges.find((e) => e.source === nodeId);
          if (agentEdge) {
            nextNodeId = agentEdge.target;
          } else {
            setExecutionStatus('finished');
          }
          break;
        case 'stop':
          setExecutionStatus('finished');
          break;
        default:
          setExecutionStatus('finished');
          break;
      }

      if (nextNodeId) {
        await executeNode(nextNodeId);
      }
    } catch (e: any) {
      setError(e.message);
      setExecutionStatus('error');
    }
  };

  const handleRun = async () => {
    setExecutionStatus('running');
    setError(null);
    setWorkflowState({});
    const startNode = nodes.find((n) => n.type === 'start');
    if (startNode) {
      await executeNode(startNode.id);
    } else {
      setError('No StartNode found in the graph.');
      setExecutionStatus('error');
    }
  };

  const handleUserInput = async (message: Message) => {
    if (executionStatus === 'pausedForInput' && currentNodeId) {
      setWorkflowState((prevState) => ({
        ...prevState,
        [currentNodeId]: message.content,
      }));
      setExecutionStatus('running');
      const connectedEdge = edges.find((e) => e.source === currentNodeId);
      if (connectedEdge) {
        await executeNode(connectedEdge.target);
      } else {
        setExecutionStatus('finished');
      }
    }
  };

  return (
    <div className="h-full flex relative">
      <RunSidebar
        onRun={handleRun}
        status={executionStatus}
        error={error}
      />
      
      <div className="flex-1 flex flex-col h-full">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={40}>
            <ReactFlow
              nodes={nodes.map((node) => ({
                ...node,
                className:
                  node.id === currentNodeId
                    ? `${node.className || ''} glowing`
                    : node.className,
              }))}
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
                  stroke: 'hsl(var(--muted-foreground))',
                },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
              }}
            >
              <Background color="hsl(var(--border))" gap={20} />
              <Controls />
              <MiniMap zoomable pannable className="bg-card border border-border" />
            </ReactFlow>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60}>
            <div className="h-full p-4 bg-card border-t border-border">
              <ChatSection handler={chatHandler}>
                <ChatMessages />
                <ChatInput>
                  <ChatInput.Form>
                    <ChatInput.Field
                      placeholder={
                        executionStatus === 'pausedForInput'
                          ? 'Please provide your input'
                          : 'Waiting for agent...'
                      }
                    />
                    <ChatInput.Submit />
                  </ChatInput.Form>
                </ChatInput>
              </ChatSection>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
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

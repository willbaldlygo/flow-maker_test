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
import { LoaderCircle } from 'lucide-react';

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

interface WorkflowNodeJson {
  id: string;
  type: string;
  data: any;
  accepts?: string;
  emits?: string;
}

interface WorkflowJson {
  nodes: WorkflowNodeJson[];
  settings: any;
  error?: string;
}

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

const getMessageContent = (data: any): string => {
  if (typeof data === 'string') {
    return data;
  }
  if (Array.isArray(data) && data.length > 0 && data[0].type === 'text' && typeof data[0].text === 'string') {
    return data[0].text;
  }
  return JSON.stringify(data, null, 2);
}

const loadSavedSettings = () => {
  try {
    const savedSettings = localStorage.getItem('agent-builder-settings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('Error loading saved settings:', error);
  }
  return {};
}

const RunViewInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [workflowState, _setWorkflowState] = useState<Record<string, any>>({});
  const workflowStateRef = useRef(workflowState);
  const [compiledWorkflow, setCompiledWorkflow] = useState<WorkflowJson | null>(
    null,
  );

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
    isLoading: executionStatus === 'running',
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

  const executeNode = async (nodeId: string, workflow: WorkflowJson) => {
    if (!workflow || !workflow.nodes) {
      setError('Workflow not compiled.');
      setExecutionStatus('error');
      return;
    }
    setCurrentNodeId(nodeId);
    const node = workflow.nodes.find((n) => n.id === `node-${nodeId}`);

    if (!node) {
      setError(`Node with ID ${nodeId} not found.`);
      setExecutionStatus('error');
      return;
    }

    try {
      let nextNodeId: string | null = null;
      switch (node.type) {
        case 'start': {
          const connectedNode = workflow.nodes.find(
            (n) => n.accepts === node.emits,
          );
          if (connectedNode) {
            nextNodeId = connectedNode.id.replace('node-', '');
          } else {
            setExecutionStatus('finished');
          }
          break;
        }
        case 'userInput':
          setExecutionStatus('pausedForInput');
          // Add a system message to the chat with the prompt from the node
          if (node.data.prompt) {
            setMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                role: 'assistant',
                content: String(node.data.prompt),
              },
            ]);
          }
          // The workflow will now wait for user input.
          // The onUserInput function will be called when the user submits a message.
          return; // Don't proceed further until user input
        case 'promptLLM': {
          const parentNode = workflow.nodes.find(
            (n) =>
              n.emits === node.accepts ||
              (typeof n.emits === 'object' &&
                Object.values(n.emits).includes(node.accepts as string)),
          );
          const input = parentNode
            ? workflowStateRef.current[parentNode.id.replace('node-', '')]
            : null;

          if (!input) {
            setError(`Input for node ${nodeId} not found.`);
            setExecutionStatus('error');
            return;
          }
        
          const thinkingMessageId = Math.random().toString();
          setMessages((prev) => [
            ...prev,
            {
              id: thinkingMessageId,
              role: 'assistant',
              content: `Thinking with ${node.data.label}...`,
            },
          ]);

          const llmResponse = await fetch('/api/llm/call', {
            method: 'POST',
            body: JSON.stringify({
              input: input,
              node: node,
              settings: loadSavedSettings()
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!llmResponse.ok) {
            throw new Error(
              `LLM execution failed: ${await llmResponse.text()}`,
            );
          }

          const { output: llmOutput } = await llmResponse.json();

          setWorkflowState((prevState) => ({
            ...prevState,
            [nodeId]: llmOutput,
          }));

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === thinkingMessageId
                ? { ...msg, content: getMessageContent(llmOutput) }
                : msg
            )
          );

          const nextNode = workflow.nodes.find(
            (n) => n.accepts === node.emits,
          );
          if (nextNode) {
            nextNodeId = nextNode.id.replace('node-', '');
          } else {
            setExecutionStatus('finished');
          }
          break;
        }
        case 'promptAgent':
          if (!workflow) {
            setError('Workflow not compiled.');
            setExecutionStatus('error');
            return;
          }
          const response = await fetch('/api/agent/run', {
            method: 'POST',
            body: JSON.stringify({
              workflow: workflow,
              settings: loadSavedSettings(),
              workflowState: workflowStateRef.current,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Agent execution failed: ${await response.text()}`);
          }

          const { output: agentOutput } = await response.json();

          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              role: 'assistant',
              content: getMessageContent(agentOutput),
            },
          ]);

          setWorkflowState((prevState) => ({
            ...prevState,
            [nodeId]: agentOutput,
          }));

          const nextAgentNode = workflow.nodes.find(
            (n) => n.accepts === node.emits,
          );
          if (nextAgentNode) {
            nextNodeId = nextAgentNode.id.replace('node-', '');
          } else {
            setExecutionStatus('finished');
          }
          break;
        case 'stop':
          setExecutionStatus('finished');
          break;
        case 'agentTool':
          // This node is not executed directly in the run view
          break;
        case 'splitter': {
          const parentNode = workflow.nodes.find(
            (n) => n.emits === node.accepts,
          );
          const input = parentNode
            ? workflowStateRef.current[parentNode.id.replace('node-', '')]
            : null;
          if (input) {
            setWorkflowState((prevState) => ({ ...prevState, [nodeId]: input }));
          }
          // The splitter itself doesn't have a single next node.
          // The logic proceeds to all connected nodes from the output handles.
          const outgoingNodes = workflow.nodes.filter(
            (n) => n.accepts && n.accepts.startsWith(node.emits as string),
          );
          for (const outNode of outgoingNodes) {
            await executeNode(outNode.id.replace('node-', ''), workflow);
          }
          return; // Custom branching, so we return here.
        }
        case 'collector': {
          // Collector waits for all its inputs to be available.
          // This simplified runner doesn't handle parallel execution fully,
          // so we assume inputs arrive sequentially.
          const parentNode = workflow.nodes.find(
            (n) => n.emits === node.accepts,
          );
          const input = parentNode
            ? workflowStateRef.current[parentNode.id.replace('node-', '')]
            : null;
          if (input) {
            const currentState = workflowStateRef.current[nodeId] || [];
            setWorkflowState((prevState) => ({
              ...prevState,
              [nodeId]: [...currentState, input],
            }));
          }

          const nextCollectorNode = workflow.nodes.find(
            (n) => n.accepts === node.emits,
          );
          if (nextCollectorNode) {
            nextNodeId = nextCollectorNode.id.replace('node-', '');
          } else {
            setExecutionStatus('finished');
          }
          break;
        }
        case 'decision': {
          const parentNode = workflow.nodes.find(
            (n) => n.emits === node.accepts,
          );
          const input = parentNode
            ? workflowStateRef.current[parentNode.id.replace('node-', '')]
            : null;

          if (!input) {
            setError(`Input for node ${nodeId} not found.`);
            setExecutionStatus('error');
            return;
          }

          // Pass the input along to the next node
          setWorkflowState((prevState) => ({ ...prevState, [nodeId]: input }));

          const thinkingMessageId = Math.random().toString();
          setMessages((prev) => [
            ...prev,
            {
              id: thinkingMessageId,
              role: 'assistant',
              content: `Evaluating: ${node.data.question}...`,
            },
          ]);

          const llmResponse = await fetch('/api/llm/call', {
            method: 'POST',
            body: JSON.stringify({
              input: input,
              node: node,
              settings: loadSavedSettings(),
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!llmResponse.ok) {
            throw new Error(
              `LLM execution failed: ${await llmResponse.text()}`,
            );
          }

          const { output: decision } = await llmResponse.json();

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === thinkingMessageId
                ? { ...msg, content: `Decision: ${decision}` }
                : msg,
            ),
          );

          // Find the output handle that matches the decision
          const handleId = decision ? 'true' : 'false';
          const nextEdge = workflow.nodes.find(
            (n) => n.accepts === (node.emits as any)[handleId],
          );
          
          if (nextEdge) {
            nextNodeId = nextEdge.id.replace('node-', '');
          } else {
            setExecutionStatus('finished');
          }
          break;
        }
      }

      if (nextNodeId) {
        await executeNode(nextNodeId, workflow);
      }
    } catch (e: any) {
      setError(e.message);
      setExecutionStatus('error');
    }
  };

  const handleRun = async () => {
    setExecutionStatus('idle');
    setError(null);
    setMessages([]);
    setWorkflowState({});
    setCurrentNodeId(null);

    const compiled = compileWorkflow(nodes, edges);
    if (!compiled || !compiled.nodes) {
      setError('Could not compile workflow. Make sure you have a Start node.');
      setExecutionStatus('error');
      return;
    }
    setCompiledWorkflow(compiled);

    const startNode = compiled.nodes.find((n: WorkflowNodeJson) => n.type === 'start');
    if (startNode) {
      setExecutionStatus('running');
      await executeNode(startNode.id.replace('node-', ''), compiled);
    } else {
      setError('No start node found in workflow.');
      setExecutionStatus('error');
    }
  };

  const handleRestart = () => {
    setExecutionStatus('idle');
    setError(null);
    setWorkflowState({});
    setMessages([]);
    setCurrentNodeId(null);
  };

  const handleUserInput = async (message: Message) => {
    if (!compiledWorkflow) {
      setError('Workflow not compiled.');
      setExecutionStatus('error');
      return;
    }

    const userInputNode = compiledWorkflow.nodes.find(
      (n) => n.id === `node-${currentNodeId}`,
    );

    if (!userInputNode || userInputNode.type !== 'userInput') {
      // This should not happen if the state is managed correctly
      setError('Something went wrong. No user input expected.');
      setExecutionStatus('error');
      return;
    }

    setWorkflowState((prevState) => ({
      ...prevState,
      [currentNodeId as string]: message.content,
    }));
    setExecutionStatus('running');

    const nextNode = compiledWorkflow.nodes.find(
      (n) => n.accepts === userInputNode.emits,
    );

    if (nextNode) {
      await executeNode(nextNode.id.replace('node-', ''), compiledWorkflow);
    } else {
      setExecutionStatus('finished');
    }
  };

  return (
    <div className="h-full flex relative">
      <RunSidebar
        onRun={handleRun}
        onRestart={handleRestart}
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
              proOptions={{ hideAttribution: true }}
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
                          : executionStatus === 'finished'
                            ? 'Workflow finished. Click Restart to run again.'
                            : 'Waiting for agent...'
                      }
                    />
                    {chatHandler.isLoading ? (
                      <div className="p-2">
                        <LoaderCircle className="spinner" />
                      </div>
                    ) : (
                      <ChatInput.Submit
                        disabled={executionStatus !== 'pausedForInput'}
                      />
                    )}
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

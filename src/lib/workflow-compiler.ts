import { Node, Edge } from '@xyflow/react';

export interface WorkflowNodeJson {
  id: string;
  type: string;
  data: any;
  accepts?: string | string[];
  emits?: string | string[] | { [key:string]: string };
  prompt?: string;
}

export interface WorkflowJson {
    nodes: WorkflowNodeJson[];
    settings: any;
}

export function compileWorkflow(nodes: Node[], edges: Edge[]): any {
  let settings = {};
  if (typeof window !== "undefined") {
    try {
      const savedSettings = localStorage.getItem('agent-builder-settings');
      if (savedSettings) {
        settings = JSON.parse(savedSettings);
      }
    } catch (e) {
      console.error("Failed to parse settings from localStorage", e);
    }
  }

  const startNode = nodes.find(node => node.type === 'start');
  if (!startNode) {
    return { error: "No start node found" };
  }

  const allReachableNodes = new Set<Node>();
  const queue: Node[] = [startNode];
  const visitedNodeIds = new Set<string>([startNode.id]);

  while (queue.length > 0) {
      const currentNode = queue.shift()!;
      allReachableNodes.add(currentNode);

      const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
      for (const edge of outgoingEdges) {
          const targetNode = nodes.find(n => n.id === edge.target);
          if (targetNode && !visitedNodeIds.has(targetNode.id)) {
              visitedNodeIds.add(targetNode.id);
              queue.push(targetNode);
          }
      }
  }
  
  const allProcessedNodes = Array.from(allReachableNodes);

  // Now, we create the flat list for the output
  const resultNodes = allProcessedNodes.map(node => {
    // We can't just call buildNodeJson again. We need a new function to format the output.
    const nodeJson: any = {
      id: `node-${node.id}`,
      type: node.type,
      data: { ...node.data },
    };
    const outgoingEdges = edges.filter(e => e.source === node.id);

    if (node.type === 'promptAgent') {
      nodeJson.data.tools = [];
      const toolEdges = outgoingEdges.filter(edge => {
        const targetNode = nodes.find(n => n.id === edge.target);
        return targetNode && targetNode.type === 'agentTool';
      });

      for (const edge of toolEdges) {
        const toolNode = nodes.find(n => n.id === edge.target);
        if (toolNode) {
          const toolConfigStr = localStorage.getItem(`agent-tool-config-${toolNode.id}`);
          let toolConfig = {};
          if (toolConfigStr) {
            try {
              toolConfig = JSON.parse(toolConfigStr);
            } catch(e) {
              console.error("Failed to parse tool config", e);
            }
          }
          // This should just be the tool node's data, not a recursive call.
          nodeJson.data.tools.push({
            id: `node-${toolNode.id}`,
            type: toolNode.type,
            name: toolNode.data.label,
            ...toolConfig
          });
        }
      }
    }

    if (node.type === 'promptAgent' && node.data) {
      if (node.data.llm) {
        nodeJson.data.llm = node.data.llm;
      }
      if (node.data.systemPrompt) {
        nodeJson.data.prompt = node.data.systemPrompt;
      }
    }

    if (node.type === 'userInput' && node.data && node.data.prompt) {
      nodeJson.data.prompt = node.data.prompt;
    }

    if (node.type === 'promptLLM' && node.data && node.data.promptPrefix) {
      nodeJson.data.promptPrefix = node.data.promptPrefix;
    }

    if (node.type === 'decision' && node.data) {
      if (node.data.question) {
        nodeJson.data.question = node.data.question;
      }
      const trueEdge = outgoingEdges.find(e => e.sourceHandle === 'true');
      const falseEdge = outgoingEdges.find(e => e.sourceHandle === 'false');
      const emits: { [key: string]: string } = {};
      if (trueEdge) {
        emits['true'] = `event-${trueEdge.id}`;
      }
      if (falseEdge) {
        emits['false'] = `event-${falseEdge.id}`;
      }
      nodeJson.emits = emits;
    } else {
      const primaryEdge = node.type === 'promptAgent'
        ? outgoingEdges.find(edge => nodes.find(n => n.id === edge.target)?.type !== 'agentTool')
        : outgoingEdges[0];

      if (primaryEdge) {
        nodeJson.emits = `event-${primaryEdge.id}`;
      }
    }
    
    const incomingEdges = edges.filter(e => e.target === node.id);
    if (incomingEdges.length > 0) {
      // This logic is getting complicated. Let's simplify.
      // A node accepts an event from its incoming connection.
      const relevantEdges = incomingEdges.filter(e => {
        const source = nodes.find(n => n.id === e.source);
        return !(source?.type === 'promptAgent' && nodeJson.type === 'agentTool');
      })

      if (relevantEdges.length > 1) {
        nodeJson.accepts = relevantEdges.map(e => `event-${e.id}`);
      } else if (relevantEdges.length === 1) {
        nodeJson.accepts = `event-${relevantEdges[0].id}`;
      }
    }

    if (node.type === 'start') {
        delete nodeJson.accepts;
    }


    return nodeJson;
  });

  // Filter out the tool nodes from the top-level list
  const toolNodeIds = new Set<string>();
  edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (sourceNode && sourceNode.type === 'promptAgent' && targetNode && targetNode.type === 'agentTool') {
          toolNodeIds.add(targetNode.id);
      }
  });

  const finalNodes = resultNodes.filter(n => !toolNodeIds.has(n.id.replace('node-','')));

  return { nodes: finalNodes, settings };
} 

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

function buildNodeJson(node: Node, allNodes: Node[], allEdges: Edge[], processedNodeIds: Set<string>): any {
  if (!node || processedNodeIds.has(node.id)) {
    return null;
  }
  processedNodeIds.add(node.id);

  const outgoingEdges = allEdges.filter(edge => edge.source === node.id);
  const nodeJson: any = {
    id: `node-${node.id}`,
    type: node.type,
  };

  if (node.type === 'promptAgent') {
    nodeJson.tools = [];
    const toolEdges = outgoingEdges.filter(edge => {
      const targetNode = allNodes.find(n => n.id === edge.target);
      return targetNode && targetNode.type === 'agentTool';
    });

    for (const edge of toolEdges) {
      const toolNode = allNodes.find(n => n.id === edge.target);
      if (toolNode) {
        // Recursively build the tool node JSON, but don't add it to the main processed list yet
        const toolJson = buildNodeJson(toolNode, allNodes, allEdges, new Set());
        if (toolJson) {
          nodeJson.tools.push(toolJson);
          // Mark the tool node as processed so it's not added to the top level
          processedNodeIds.add(toolNode.id);
        }
      }
    }
  }

  // Find the primary outgoing edge that is NOT a tool connection for promptAgent
  let primaryOutgoingEdge;
  if (node.type === 'promptAgent') {
    primaryOutgoingEdge = outgoingEdges.find(edge => {
      const targetNode = allNodes.find(n => n.id === edge.target);
      return targetNode && targetNode.type !== 'agentTool';
    });
  } else {
    primaryOutgoingEdge = outgoingEdges[0];
  }


  if (primaryOutgoingEdge) {
    const nextNode = allNodes.find(node => node.id === primaryOutgoingEdge.target);
    if (nextNode) {
      const nextNodeJson = buildNodeJson(nextNode, allNodes, allEdges, processedNodeIds);
      if (nextNodeJson) {
        nodeJson.next = nextNodeJson;
        // Simplified event-based connection for top-level nodes
        nodeJson.emits = `event-${primaryOutgoingEdge.id}`;
        nextNodeJson.accepts = `event-${primaryOutgoingEdge.id}`;
      }
    }
  }

  // Remove label from the final JSON
  if (node.data && 'label' in node.data) {
    // keeping other data properties if they exist
  }

  return nodeJson;
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

  const processedNodeIds = new Set<string>();
  const allNodeJsons: any[] = [];

  // First pass: handle promptAgent and its tools
  nodes.forEach(node => {
    if (node.type === 'promptAgent') {
      const nodeJson = buildNodeJson(node, nodes, edges, processedNodeIds);
      if (nodeJson) {
        allNodeJsons.push(nodeJson);
      }
    }
  });

  // Second pass: handle all other nodes that haven't been processed
  nodes.forEach(node => {
    if (!processedNodeIds.has(node.id)) {
      const nodeJson = buildNodeJson(node, nodes, edges, processedNodeIds);
      if (nodeJson) {
        allNodeJsons.push(nodeJson);
      }
    }
  });

  // The final JSON should be a flat list of nodes, where tools are nested.
  // We need to rebuild the structure from the startNode to get the correct order and nesting.
  processedNodeIds.clear();
  const finalJson = buildNodeJson(startNode, nodes, edges, processedNodeIds);

  // After building the main path, we need to collect all nodes that were processed.
  const allProcessedNodes = nodes.filter(n => processedNodeIds.has(n.id));

  // Now, we create the flat list for the output, but the nesting logic is handled inside buildNodeJson
  const resultNodes = allProcessedNodes.map(node => {
    // Re-running buildNodeJson without recursion, just to get the final structure for each node.
    // This is not efficient and needs a better approach.
    const tempProcessedIds = new Set<string>();
    
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

    if (node.type === 'decision') {
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
      const edge = incomingEdges.find(e => {
        const source = nodes.find(n => n.id === e.source);
        return !(source?.type === 'promptAgent' && nodeJson.type === 'agentTool');
      });
      if (edge) {
        nodeJson.accepts = `event-${edge.id}`;
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
  // Find the primary incoming edge for each node to set the 'accepts' property
  finalNodes.forEach(nodeJson => {
      const nodeId = nodeJson.id.replace('node-','');
      const incomingEdge = edges.find(e => e.target === nodeId && nodes.find(n => n.id === e.source)?.type !== 'promptAgent' && nodes.find(n => n.id === e.target)?.type === 'agentTool');
      const primaryIncomingEdge = edges.find(e => {
        const sourceNode = nodes.find(n => n.id === e.source);
        if (!sourceNode) return false;
        // if the target is me, and the source is not a prompt agent sending me a tool connection
        return e.target === nodeId && (sourceNode.type !== 'promptAgent' || nodes.find(n => n.id === e.target)?.type !== 'agentTool');
      });

      const incomingEdges = edges.filter(e => e.target === nodeId);
      if (incomingEdges.length > 0) {
        // This logic is getting complicated. Let's simplify.
        // A node accepts an event from its incoming connection.
        const edge = incomingEdges.find(e => {
          const source = nodes.find(n => n.id === e.source);
          return !(source?.type === 'promptAgent' && nodeJson.type === 'agentTool');
        })
        if (edge) {
          nodeJson.accepts = `event-${edge.id}`;
        }
      }

      if (nodeJson.type === 'start') {
        delete nodeJson.accepts;
      }
  });


  return { nodes: finalNodes, settings };
} 

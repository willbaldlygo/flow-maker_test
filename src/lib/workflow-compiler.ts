import { Node, Edge } from '@xyflow/react';

export interface WorkflowNodeJson {
  id: string;
  type: string;
  data: any;
  accepts?: string | string[];
  emits?: string | string[] | { [key:string]: string };
}

export interface WorkflowJson {
    nodes: WorkflowNodeJson[];
}

export const generateWorkflowJson = (nodes: Node[], edges: Edge[]): WorkflowJson | null => {
    if (nodes.length === 0) {
        return { nodes: [] };
    }

    const workflowNodes: WorkflowNodeJson[] = [];

    for (const node of nodes) {
        if (!node.type) {
            console.error(`Node with id ${node.id} has no type`);
            continue;
        }

        const data: any = {};
        if (node.type === 'userInput' && node.data.prompt) {
            data.prompt = node.data.prompt;
        } else {
            for (const key in node.data) {
                if (key !== 'label') {
                    data[key] = node.data[key];
                }
            }
        }

        const workflowNode: WorkflowNodeJson = {
            id: node.id,
            type: node.type,
            data: data,
        };

        // Determine 'accepts' from incoming edges
        if (node.type !== 'start') {
            workflowNode.accepts = `event-${node.id}`;
        }

        // Determine 'emits' from outgoing edges
        const outgoingEdges = edges.filter(edge => edge.source === node.id);
        if (node.type !== 'stop' && outgoingEdges.length > 0) {
            if (node.type === 'decision') {
                const emitsObj: { [key: string]: string } = {};
                for (const edge of outgoingEdges) {
                    const sourceHandle = edge.sourceHandle || 'default';
                    emitsObj[sourceHandle] = `event-${edge.target}`;
                }
                workflowNode.emits = emitsObj;
            } else if (outgoingEdges.length > 1) { // Splitter
                workflowNode.emits = outgoingEdges.map(edge => `event-${edge.target}`);
            } else { // Single output
                workflowNode.emits = `event-${outgoingEdges[0].target}`;
            }
        }

        workflowNodes.push(workflowNode);
    }

    return { nodes: workflowNodes };
}; 

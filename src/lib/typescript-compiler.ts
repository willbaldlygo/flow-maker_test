import { WorkflowJson, WorkflowNodeJson } from './workflow-compiler';

const LlamaIndexTemplate = (events: string, handlers: string) => `
import { Workflow, workflow } from '@llamaindex/workflow-core';
${events}

const w = new Workflow();
${handlers}

export default w;
`;

const sanitizeId = (id: string) => `event_${id.replace(/[^a-zA-Z0-9_]/g, '_')}`;

const generateEvents = (nodes: WorkflowNodeJson[]): string => {
    let eventLines: string[] = [];
    for (const node of nodes) {
        const eventName = sanitizeId(node.id);
        eventLines.push(`const ${eventName} = workflow.defineEvent<any>('${eventName}');`);
    }
    return eventLines.join('\n');
}

const generateHandlers = (nodes: WorkflowNodeJson[]): string => {
    let handlerLines: string[] = [];
    for (const node of nodes) {
        const acceptsEventName = node.type === 'start' ? 'workflow.startEvent' : sanitizeId(node.id);
        
        let handlerBody = '';
        if (node.emits) {
            if (typeof node.emits === 'string') {
                const emitEventName = sanitizeId(node.emits.replace('event-', ''));
                handlerBody = `w.emit(${emitEventName}, ctx.payload);`;
            } else if (Array.isArray(node.emits)) {
                handlerBody = node.emits.map(e => `w.emit(${sanitizeId(e.replace('event-', ''))}, ctx.payload);`).join('\n    ');
            } else { // decision node
                const cases = Object.entries(node.emits).map(([key, value]) => {
                    const emitEventName = sanitizeId(value.replace('event-', ''));
                    return `if (ctx.payload.condition === '${key}') {\n      w.emit(${emitEventName}, ctx.payload);\n    }`;
                }).join(' else ');
                handlerBody = `${cases}`;
            }
        } else if (node.type === 'stop') {
            handlerBody = `console.log('Workflow stopped.');`;
        }

        handlerLines.push(`w.on(${acceptsEventName}, (ctx) => {\n    console.log('Handling event for node ${node.id}');\n    ${handlerBody}\n});`);
    }
    return handlerLines.join('\n\n');
}

export const generateTypescript = (json: WorkflowJson): string => {
    const events = generateEvents(json.nodes);
    const handlers = generateHandlers(json.nodes);

    return LlamaIndexTemplate(events, handlers);
}; 


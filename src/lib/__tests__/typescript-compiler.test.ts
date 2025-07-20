import { describe, it, expect } from 'vitest';
import { generateTypescript } from '../typescript-compiler';
import { WorkflowJson } from '../workflow-compiler';

describe('typescript-compiler', () => {
  it('returns a comment for an empty workflow', () => {
    const emptyWorkflow: WorkflowJson = {
      nodes: [],
      settings: {},
    };
    const result = generateTypescript(emptyWorkflow);
    expect(result).toBe('// Your workflow is empty.');
  });

  it('generates correct code for a simple start-stop workflow', () => {
    const workflow: WorkflowJson = {
      nodes: [
        { id: 'start-1', type: 'start', data: {}, emits: 'event-1' },
        { id: 'stop-1', type: 'stop', data: {}, accepts: 'event-1' },
      ],
      settings: {},
    };

    const result = generateTypescript(workflow);

    // Check for event definitions
    expect(result).toContain('const startEvent = workflowEvent<any>();');
    expect(result).toContain('const stopEvent = workflowEvent<any>();');
    expect(result).toContain('const event_1 = workflowEvent<any>();');

    // Check for start handler
    expect(result).toContain('workflow.handle([startEvent], async (ctx) => {');
    expect(result).toContain('return event_1.with(ctx.data);');
    
    // Check for stop handler
    expect(result).toContain('workflow.handle([event_1], async (ctx) => {');
    expect(result).toContain('return stopEvent.with(ctx.data);');

    // Check for execution logic
    expect(result).toContain('sendEvent(startEvent.with());');
    expect(result).toContain('if (stopEvent.include(event)) {');
  });

  it('generates correct code for a workflow with user input', () => {
    const workflow: WorkflowJson = {
      nodes: [
        { id: 'start-1', type: 'start', data: {}, emits: 'event-1' },
        { id: 'user-input-1', type: 'userInput', data: { prompt: 'Enter your name:' }, accepts: 'event-1', emits: 'event-2' },
        { id: 'stop-1', type: 'stop', data: {}, accepts: 'event-2' },
      ],
      settings: {},
    };

    const result = generateTypescript(workflow);

    // Check for imports
    expect(result).toContain('import { createInterface } from "node:readline/promises";');

    // Check for event definitions
    expect(result).toContain('const need_input_for_event_2 = workflowEvent<any>();');
    expect(result).toContain('const event_2 = workflowEvent<any>();');
    
    // Check for userInput handler
    expect(result).toContain('workflow.handle([event_1], async () => {');
    expect(result).toContain('return need_input_for_event_2.with("Enter your name:");');

    // Check for execution logic
    expect(result).toContain('const readline = createInterface({');
    expect(result).toContain('} else if (need_input_for_event_2.include(event)) {');
    expect(result).toContain('const input = await readline.question(event.data);');
    expect(result).toContain('sendEvent(event_2.with(input));');
    expect(result).toContain('readline.close();');
  });

  it('generates correct code for a workflow with a promptAgent', () => {
    const workflow: WorkflowJson = {
      nodes: [
        { id: 'start-1', type: 'start', data: {}, emits: 'event-1' },
        { id: 'agent-1', type: 'promptAgent', data: { prompt: 'You are a helpful assistant.' }, accepts: 'event-1', emits: 'event-2' },
        { id: 'stop-1', type: 'stop', data: {}, accepts: 'event-2' },
      ],
      settings: {
        defaultLLM: 'gpt-4o',
        apiKeys: {
          openai: 'test-key',
        }
      },
    };

    const result = generateTypescript(workflow);

    // Check for imports
    expect(result).toContain('import { OpenAI } from "@llamaindex/openai";');
    expect(result).toContain('import { agent } from "@llamaindex/workflow";');
    
    // Check for LLM initialization
    expect(result).toContain('const OPENAI_API_KEY = "test-key";');
    expect(result).toContain('const gpt41Mini = new OpenAI({ model: "gpt-4.1-mini", temperature: 0.2, apiKey: OPENAI_API_KEY });');

    // Check for agent handler
    expect(result).toContain('workflow.handle([event_1], async (ctx) => {');
    expect(result).toContain('const configuredAgent = agent({');
    expect(result).toContain('llm: gpt41Mini');
    expect(result).toContain('systemPrompt: "You are a helpful assistant."');
    expect(result).toContain('const result = await configuredAgent.run(ctx.data);');
    expect(result).toContain('return event_2.with(result.data.result);');
  });
}); 

import { getLlmModelName } from "./llm-utils";
import { WorkflowJson, WorkflowNodeJson } from "./workflow-compiler";

const toCamelCase = (str: string): string => {
  if (!str) return '';
  const words = str.replace(/[^a-zA-Z0-9_]+/g, ' ').split(/[_\s]+/);

  const camelCased = words
    .filter(word => word.length > 0)
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');

  if (!camelCased) return '';

  if (/^\d/.test(camelCased)) {
    return `_${camelCased}`;
  }
  
  return camelCased;
};

const LlamaIndexTemplate = (
  imports: string,
  llmInit: string,
  tools: string,
  events: string,
  handlers: string,
  execution: string,
) => `
import { createWorkflow, workflowEvent } from "@llamaindex/workflow-core";
${imports}

${llmInit}

const workflow = createWorkflow();

${tools}

${events}

${handlers}

${execution}
`;

const getEventName = (eventId: string) => eventId.replace(/-/g, "_");

const generateImports = (json: WorkflowJson): string => {
  const imports = new Set<string>();
  const hasPromptAgent = json.nodes.some((node) => node.type === "promptAgent");
  const hasPromptLLM = json.nodes.some((node) => node.type === "promptLLM");
  const hasTools = json.nodes.some(
    (node: any) =>
      node.type === "promptAgent" && node.data.tools && node.data.tools.length > 0,
  );
  const hasUserInput = json.nodes.some((node) => node.type === "userInput");

  if (json.settings?.apiKeys?.openai) {
    imports.add('process.env.OPENAI_API_KEY = "dummy";'); // prevent fallback to env
  }
  if (json.settings?.apiKeys?.anthropic) {
    imports.add('process.env.ANTHROPIC_API_KEY = "dummy";');
  }
  if (json.settings?.apiKeys?.google) {
    imports.add('process.env.GOOGLE_API_KEY = "dummy";');
  }

  if (hasPromptAgent || hasPromptLLM) {
    if (hasPromptAgent) {
      imports.add('import { agent } from "@llamaindex/workflow";');
    }
    const llmProvider = json.settings?.defaultLLM || "gpt-4o";
    if (llmProvider.startsWith("gpt")) {
      imports.add('import { OpenAI } from "@llamaindex/openai";');
    } else if (llmProvider.startsWith("claude")) {
      imports.add('import { Anthropic } from "@llamaindex/anthropic";');
    } else if (llmProvider.startsWith("gemini")) {
      imports.add('import { Gemini } from "@llamaindex/google";');
    }
  }

  if (hasTools) {
    imports.add('import { tool } from "llamaindex";');
    imports.add('import { z } from "zod";');
  }

  if (hasUserInput) {
    imports.add('import { createInterface } from "node:readline/promises";');
  }

  return [...imports].join("\n");
};

const generateLlmInit = (json: WorkflowJson): string => {
  const lines: string[] = [];
  if (json.settings?.llamaCloudApiKey) {
    lines.push(
      `const LLAMACLOUD_API_KEY = "${json.settings.llamaCloudApiKey}";`,
    );
  }

  if (json.settings?.apiKeys?.openai) {
    lines.push(`const OPENAI_API_KEY = "${json.settings.apiKeys.openai}";`);
  }
  if (json.settings?.apiKeys?.anthropic) {
    lines.push(`const ANTHROPIC_API_KEY = "${json.settings.apiKeys.anthropic}";`);
  }
  if (json.settings?.apiKeys?.google) {
    lines.push(`const GOOGLE_API_KEY = "${json.settings.apiKeys.google}";`);
  }

  const indexTools = json.nodes
    .filter(
      (node: any) =>
        node.type === "promptAgent" && node.data.tools && node.data.tools.length > 0,
    )
    .flatMap((node: any) => node.data.tools)
    .filter((tool: any) => tool.toolType === "llamacloud-index");

  if (indexTools.length > 0) {
    indexTools.forEach((tool: any) => {
      if (tool.selectedIndex) {
        lines.push(
          `const LLAMACLOUD_INDEX_ID_${tool.id.replace(/-/g, "_")} = "${
            tool.selectedIndex
          }";`,
        );
      }
    });
  }

  if (json.nodes.some((node) => node.type === "promptAgent" || node.type === "promptLLM")) {
    const llmConfigs = new Map<string, any>();
    json.nodes.forEach(node => {
      if ((node.type === "promptAgent" || node.type === "promptLLM")) {
        const llmIdentifier = node.data.llm || json.settings?.defaultLLM;
        if (llmIdentifier && !llmConfigs.has(llmIdentifier)) {
          llmConfigs.set(llmIdentifier, { data: node.data });
        }
      }
    });

    if (llmConfigs.size === 0 && json.settings?.defaultLLM) {
      llmConfigs.set(json.settings.defaultLLM, { data: {} });
    }

    llmConfigs.forEach((nodeData, llmProvider) => {
      const modelName = getLlmModelName(json.settings, nodeData);
      const llmVarName = toCamelCase(modelName);
      const temperature = nodeData?.data?.temperature ?? 0.2;

      if (llmProvider.startsWith("gpt")) {
        lines.push(
          `const ${llmVarName} = new OpenAI({ model: "${modelName}", temperature: ${temperature}, apiKey: OPENAI_API_KEY });`,
        );
      } else if (llmProvider.startsWith("claude")) {
        lines.push(
          `const ${llmVarName} = new Anthropic({ model: "${modelName}", temperature: ${temperature}, apiKey: ANTHROPIC_API_KEY });`,
        );
      } else if (llmProvider.startsWith("gemini")) {
        lines.push(
          `const ${llmVarName} = new Gemini({ model: "${modelName}", temperature: ${temperature}, apiKey: GOOGLE_API_KEY });`,
        );
      }
    });
  }
  return lines.join("\n");
};

const generateTools = (json: WorkflowJson): string => {
  const toolLines: string[] = [];
  const toolNodes = json.nodes
    .filter(
      (node: any) =>
        node.type === "promptAgent" && node.data.tools && node.data.tools.length > 0,
    )
    .flatMap((node: any) => node.data.tools);

  for (const tool of toolNodes) {
    if (tool.toolType === "llamacloud-index") {
      const toolDescription = tool.description || "Search index of resumes";
      const baseName = tool.name || toolDescription.split(" ").at(0) || `search_index_${tool.id.replace(/-/g, "_")}`;
      const camelCaseName = toCamelCase(baseName);
      const functionName = `search_index_func_${tool.id.replace(/-/g, "_")}`;
      const indexIdConst = `LLAMACLOUD_INDEX_ID_${tool.id.replace(/-/g, "_")}`;

      toolLines.push(`
const ${functionName} = async ( { query } : { query: string } ) => {
    console.log(\`Searching index for \${query}\`);

    let projectId = false;
    let organizationId = false;
    try {
        const response = await fetch('https://api.cloud.llamaindex.ai/api/v1/projects/current', {
          headers: {
            'Authorization': \`Bearer \${LLAMACLOUD_API_KEY}\`,
            'Content-Type': 'application/json'
          }
        });
    
        if (response.status === 200) {
          const data = await response.json();
          projectId = data.id;
          organizationId = data.organization_id;
        }
    } catch (error) {
        console.error(error);
    }

    if (!projectId || !organizationId) {
        console.error("Could not retrieve project or organization ID");
        return "Could not retrieve project or organization ID";
    }

    const retrieverApiUrl = \`https://api.cloud.llamaindex.ai/api/v1/retrievers/retrieve?project_id=\${projectId}&organization_id=\${organizationId}\`;
    
    const retrieverPayload = {
      mode: "full",
      query: query,
      pipelines: [
        {
          name: "Whatever",
          description: "Whatever",
          pipeline_id: ${indexIdConst},
          preset_retrieval_parameters: {
            dense_similarity_top_k: 1
          }
        }
      ]
    };
    
    const retrieverResponse = await fetch(retrieverApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${LLAMACLOUD_API_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(retrieverPayload)
    });

    const retrieverData = await retrieverResponse.json();

    console.log("Retrieved " + retrieverData.nodes.length + " nodes");

    return JSON.stringify(retrieverData);
};

const ${camelCaseName} = tool(${functionName}, {
  name: '${camelCaseName}',
  description: '${toolDescription}',
  parameters: z.object({
    query: z.string({
      description: 'The query to search the index',
    }),
  }),
});
`);
    }
  }

  return toolLines.join("\n");
};

const generateEvents = (nodes: WorkflowNodeJson[]): string => {
  const eventNames = new Set<string>();
  eventNames.add("startEvent");
  eventNames.add("stopEvent");

  nodes.forEach((node) => {
    if (node.type === "userInput") {
      if (node.emits && typeof node.emits === "string") {
        const gotInputEventName = getEventName(node.emits);
        const needInputEventName = `need_input_for_${gotInputEventName}`;
        eventNames.add(gotInputEventName);
        eventNames.add(needInputEventName);
      }
    } else if (node.emits) {
      if (typeof node.emits === "string") {
        eventNames.add(getEventName(node.emits));
      } else if (Array.isArray(node.emits)) {
        node.emits.forEach((e) => eventNames.add(getEventName(e)));
      } else {
        // decision node
        Object.values(node.emits).forEach((e) =>
          eventNames.add(getEventName(e)),
        );
      }
    }
  });

  return [...eventNames]
    .map((name) => `const ${name} = workflowEvent<any>();`)
    .join("\n");
};

const generateHandlers = (json: WorkflowJson): string => {
  let handlerLines: string[] = [];
  const { nodes } = json;

  for (const node of nodes) {
    if (node.type === 'start') {
      const startEventName = getEventName('startEvent');
      const nextEventName = getEventName(node.emits as string);
      handlerLines.push(`
workflow.handle([${startEventName}], async (ctx) => {
    return ${nextEventName}.with(ctx.data);
});
`);
    } else if (node.type === 'userInput') {
        const incomingEvent = getEventName(node.accepts as string);
        const outgoingEvent = getEventName(node.emits as string);
        const promptText = node.data.prompt || 'Please provide input:';
        handlerLines.push(`
workflow.handle([${incomingEvent}], async () => {
    return need_input_for_${outgoingEvent}.with("${promptText}");
});
`);
    } else if (node.type === 'promptAgent') {
      const incomingEvent = getEventName(node.accepts as string);
      const outgoingEvent = getEventName(node.emits as string);
      
      const toolNames = (node.data.tools || []).map((tool: any) => toCamelCase(tool.name));
      const modelName = getLlmModelName(json.settings, { data: node.data });
      const llmVarName = toCamelCase(modelName);
      const systemPrompt = node.data.prompt;

      const agentProperties = [
        `llm: ${llmVarName}`,
        `tools: [${toolNames.join(", ")}]`,
      ];

      if (systemPrompt) {
        agentProperties.push(`systemPrompt: ${JSON.stringify(systemPrompt)}`);
      }
      
      handlerLines.push(`
workflow.handle([${incomingEvent}], async (ctx) => {
    const configuredAgent = agent({ 
        ${agentProperties.join(",\n        ")} 
    });
    const result = await configuredAgent.run(ctx.data);
    return ${outgoingEvent}.with(result.data.result);
});
`);
    } else if (node.type === 'stop') {
        const incomingEvent = getEventName(node.accepts as string);
        handlerLines.push(`
workflow.handle([${incomingEvent}], async (ctx) => {
    return stopEvent.with(ctx.data);
});
`);
    }
  }
  return handlerLines.join("\n");
};

const generateExecution = (
  startEvent: string,
  stopEvent: string,
  nodes: WorkflowNodeJson[],
): string => {
  const userInputNodes = nodes.filter((node) => node.type === "userInput");
  const hasUserInput = userInputNodes.length > 0;

  const readlineInit = hasUserInput
    ? `
const readline = createInterface({
    input: process.stdin,
    output: process.stdout
});`
    : "";

  const readlineClose = hasUserInput ? `readline.close();` : "";

  const inputHandlers = userInputNodes
    .map((node) => {
      const gotInputEventName = getEventName(node.emits as string);
      const needInputEventName = `need_input_for_${gotInputEventName}`;
      return `
    } else if (${needInputEventName}.include(event)) {
        const input = await readline.question(event.data);
        sendEvent(${gotInputEventName}.with(input));`;
    })
    .join("");

  return `
const { stream, sendEvent } = workflow.createContext();
${readlineInit}

sendEvent(${startEvent}.with());

(async () => {
    for await (const event of stream) {
        console.log("Event data: ", event.data);
        if (${stopEvent}.include(event)) {
            break;${inputHandlers}
        }
    }
    ${readlineClose}
})();
`;
};

export const generateTypescript = (json: WorkflowJson): string => {
  if (!json.nodes || json.nodes.length === 0) {
    return "// Your workflow is empty.";
  }

  const imports = generateImports(json);
  const llmInit = generateLlmInit(json);
  const tools = generateTools(json);
  const events = generateEvents(json.nodes);
  const handlers = generateHandlers(json);
  const execution = generateExecution("startEvent", "stopEvent", json.nodes);

  return LlamaIndexTemplate(
    imports,
    llmInit,
    tools,
    events,
    handlers,
    execution,
  );
}; 


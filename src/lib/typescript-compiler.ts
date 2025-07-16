import { WorkflowJson, WorkflowNodeJson } from "./workflow-compiler";

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
  const hasTools = json.nodes.some(
    (node: any) =>
      node.type === "promptAgent" && node.tools && node.tools.length > 0,
  );
  const hasUserInput = json.nodes.some((node) => node.type === "userInput");

  if (hasPromptAgent) {
    imports.add('import { agent } from "@llamaindex/workflow";');
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

  const indexTools = json.nodes
    .filter(
      (node: any) =>
        node.type === "promptAgent" && node.tools && node.tools.length > 0,
    )
    .flatMap((node: any) => node.tools)
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

  if (json.nodes.some((node) => node.type === "promptAgent")) {
    const llmProvider = json.settings?.defaultLLM || "gpt-4o";
    if (llmProvider.startsWith("gpt")) {
      lines.push(
        `const llm = new OpenAI({ model: "gpt-4.1-mini", temperature: 0.2 });`,
      );
    } else if (llmProvider.startsWith("claude")) {
      lines.push(
        `const llm = new Anthropic({ model: "claude-sonnet-4-20250514", temperature: 0.2 });`,
      );
    } else if (llmProvider.startsWith("gemini")) {
      lines.push(
        `const llm = new Gemini({ model: "gemini-2.5-pro-latest", temperature: 0.2 });`,
      );
    }
  }
  return lines.join("\n");
};

const generateTools = (json: WorkflowJson): string => {
  const toolLines: string[] = [];
  const toolNodes = json.nodes
    .filter(
      (node: any) =>
        node.type === "promptAgent" && node.tools && node.tools.length > 0,
    )
    .flatMap((node: any) => node.tools);

  for (const tool of toolNodes) {
    if (tool.toolType === "llamacloud-index") {
      const toolName =
        tool.name || `search_index_${tool.id.replace(/-/g, "_")}`;
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

    console.log(\`Retrieved \${retrieverData.nodes.length} nodes\`);

    return JSON.stringify(retrieverData);
};

const ${toolName} = tool(${functionName}, {
  name: '${tool.name || 'searchIndex'}',
  description: '${tool.description || 'Search index of resumes'}',
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

const generateHandlers = (nodes: WorkflowNodeJson[]): string => {
  let handlerLines: string[] = [];

  for (const node of nodes) {
    if (node.type === "stop") {
      continue;
    }

    let incomingEventNames: string[] = [];
    if (node.type === "start") {
      incomingEventNames.push("startEvent");
    } else if (node.accepts) {
      if (typeof node.accepts === "string") {
        incomingEventNames.push(getEventName(node.accepts));
      } else {
        incomingEventNames.push(...node.accepts.map(getEventName));
      }
    }

    if (incomingEventNames.length === 0) {
      continue;
    }

    const nextNode = nodes.find((n) => n.accepts === node.emits);
    const nextEventName =
      nextNode?.type === "stop"
        ? "stopEvent"
        : node.emits && typeof node.emits === "string"
          ? getEventName(node.emits)
          : null;

    if (!nextEventName) {
      // For now, we skip nodes that don't have a clear single exit.
      // This includes decision nodes.
      continue;
    }

    let handlerBody = "";
    if (node.type === "userInput") {
      const gotInputEventName = getEventName(node.emits as string);
      const needInputEventName = `need_input_for_${gotInputEventName}`;
      const prompt =
        (node as any).prompt?.replace(/`/g, "\\`") || "Enter your input:";
      handlerBody = `
    return ${needInputEventName}.with("${prompt}");`;
    } else if (node.type === "promptAgent") {
      const toolNames =
        (node as any).tools?.map(
          (t: any) => t.name || `search_index_${t.id.replace(/-/g, "_")}`,
        ) || [];

      handlerBody = `
    const indexAgent = agent({
        llm: llm,
        tools: [${toolNames.join(", ")}]
    });
    const result = await indexAgent.run(ctx.data);
    return ${nextEventName}.with( result.data.result ?? "No result" );`;
    } else {
      handlerBody = `
    return ${nextEventName}.with(ctx.data);`;
    }

    handlerLines.push(`
workflow.handle([${incomingEventNames.join(", ")}], async (ctx) => {${handlerBody}
});
`);
  }

  // Add a final handler for the stop event
  handlerLines.push(`
workflow.handle([stopEvent], (ctx) => {
    // Workflow stop.
});
`);

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
  const handlers = generateHandlers(json.nodes);
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


import { NextRequest, NextResponse } from 'next/server';
import { Settings, LLM, tool } from 'llamaindex';
import { agent } from '@llamaindex/workflow';
import { z } from 'zod';
import { getLlm } from '@/lib/llm-utils';

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

export async function POST(req: NextRequest) {
  try {
    console.log('Agent run request received');
    const { workflow, settings, workflowState } = await req.json();
    const agentNode = workflow.nodes.find((n: any) => n.type === 'promptAgent');
    console.log('Found agent node:', agentNode?.id);

    if (!agentNode) {
      return NextResponse.json(
        { error: 'No promptAgent node found' },
        { status: 400 },
      );
    }

    const llamaCloudApiKey = settings?.llamaCloudApiKey;
    if (!llamaCloudApiKey) {
      return NextResponse.json(
        { error: 'LlamaCloud API key not found in settings' },
        { status: 400 },
      );
    }

    // 1. Get user input by traversing backwards from the agent node
    let currentNode = agentNode;
    let userInput = null;
    let visited = new Set(); // To prevent infinite loops in case of cycles

    while (currentNode && !visited.has(currentNode.id)) {
      visited.add(currentNode.id);
      const parentNode = workflow.nodes.find(
        (n: any) => n.emits === currentNode.accepts || (typeof n.emits === 'object' && Object.values(n.emits).includes(currentNode.accepts)),
      );
      
      if (!parentNode) {
        break;
      }

      const parentNodeId = parentNode.id.replace('node-', '');
      const parentState = workflowState[parentNodeId];

      if (parentState) {
        userInput = parentState;
        break;
      }
      
      currentNode = parentNode;
    }

    if (!userInput) {
      return NextResponse.json(
        { error: 'Could not find input for agent' },
        { status: 400 },
      );
    }
    console.log(`User input for agent: "${userInput}"`);


    // 2. Configure LLM
    const llm = getLlm(settings) as LLM<object, object> & {
      supportToolCall: true;
      exec(options: any): any;
      streamExec(options: any): any;
    };

    // 3. Create dynamic tools for the agent
    const tools: any[] = [];
    if (agentNode.data.tools && agentNode.data.tools.length > 0) {
      console.log(`Creating ${agentNode.data.tools.length} tools...`);
      for (const toolConfig of agentNode.data.tools) {
        const toolFunc = async ({ query }: { query: string }) => {
          console.log(
            `Tool '${toolConfig.name}' called with query: "${query}"`,
          );

          let projectId = '';
          let organizationId = '';
          const projectResponse = await fetch(
            'https://api.cloud.llamaindex.ai/api/v1/projects/current',
            {
              headers: {
                Authorization: `Bearer ${llamaCloudApiKey}`,
                'Content-Type': 'application/json',
              },
            },
          );
          if (projectResponse.status === 200) {
            const data = await projectResponse.json();
            projectId = data.id;
            organizationId = data.organization_id;
          } else {
            return 'Could not retrieve project or organization ID';
          }

          const retrieverApiUrl = `https://api.cloud.llamaindex.ai/api/v1/retrievers/retrieve?project_id=${projectId}&organization_id=${organizationId}`;
          const retrieverPayload = {
            mode: 'full',
            query: query,
            pipelines: [
              {
                name: 'Whatever',
                description: 'Whatever',
                pipeline_id: toolConfig.selectedIndex,
                preset_retrieval_parameters: { dense_similarity_top_k: 10 },
              },
            ],
          };

          console.log(`retrieverPayload: ${JSON.stringify(retrieverPayload)}`);

          const retrieverResponse = await fetch(retrieverApiUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${llamaCloudApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(retrieverPayload),
          });
          const retrieverData = await retrieverResponse.json();

          console.log(`retrieverData: ${JSON.stringify(retrieverData)}`);
          console.log(
            `Tool '${toolConfig.name}' retrieved ${
              retrieverData.nodes?.length || 0
            } nodes`,
          );
          return JSON.stringify(retrieverData);
        };

        const sanitizedToolName = toCamelCase(toolConfig.name);
        const dynamicTool = tool(toolFunc, {
          name: sanitizedToolName,
          description:
            toolConfig.description || `Search index named ${toolConfig.name}`,
          parameters: z.object({
            query: z.string({
              description: 'The query to search the index with.',
            }),
          }),
        });
        tools.push(dynamicTool);
      }
    }

    // 4. Create and run the agent
    console.log('Creating workflow agent...');
    const workflowAgent = agent({
      tools,
      llm,
      systemPrompt: agentNode.data.prompt
    });

    console.log('Running agent...');
    const response = await workflowAgent.run(userInput);

    console.log('Received response from agent.');
    return NextResponse.json({ output: response.data.result });
  } catch (e: any) {
    console.error('Agent execution error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 

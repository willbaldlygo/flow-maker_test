import { NextRequest, NextResponse } from 'next/server';
import { Settings, LLM, tool } from 'llamaindex';
import { agent } from '@llamaindex/workflow';
import { z } from 'zod';
import { getLlm } from '@/lib/llm-utils';

export async function POST(req: NextRequest) {
  try {
    console.log('Agent run request received');
    const { workflow, settings, workflowState } = await req.json();
    const agentNode = workflow.find((n: any) => n.type === 'promptAgent');
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

    // 1. Get user input
    const inputEdge = workflow.find(
      (n: any) => n.emits === agentNode.accepts,
    );
    if (!inputEdge) {
      return NextResponse.json(
        { error: 'Could not find input for agent' },
        { status: 400 },
      );
    }
    const inputNodeId = inputEdge.id.replace('node-', '');
    const userInput = workflowState[inputNodeId];
    console.log(`User input for agent: "${userInput}"`);

    if (!userInput) {
      return NextResponse.json(
        { error: 'User input not found' },
        { status: 400 },
      );
    }

    // 2. Configure LLM
    const llm = getLlm(settings);

    // 3. Create dynamic tools for the agent
    const tools: any[] = [];
    if (agentNode.tools && agentNode.tools.length > 0) {
      console.log(`Creating ${agentNode.tools.length} tools...`);
      for (const toolConfig of agentNode.tools) {
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

        const sanitizedToolName = toolConfig.name.replace(/[^a-zA-Z0-9_-]/g, '_');
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

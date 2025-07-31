import { NextRequest, NextResponse } from "next/server";
import { getLlm } from "@/lib/llm-utils";
import { MessageContent, LLM, OpenAI, Anthropic, Gemini } from "llamaindex";

// This function is a modified version of getLlm that forces the use of environment variables
const getLlmFromEnv = (settings: any, nodeData: any = {}) => {
  const llmProvider = nodeData?.data?.llm || settings?.defaultLLM || "gpt-4o";
  let llm: LLM;

  // Determine the model name based on the provider
  const model = nodeData?.data?.model || (llmProvider.startsWith("gpt") ? "gpt-4.1-mini" : llmProvider.startsWith("claude") ? "claude-sonnet-4-20250514" : "gemini-1.5-pro-latest");
  const temperature = nodeData?.data?.temperature ?? 0.2;

  if (llmProvider.startsWith("gpt")) {
    llm = new OpenAI({ model, temperature, apiKey: process.env.OPENAI_API_KEY });
  } else if (llmProvider.startsWith("claude")) {
    llm = new Anthropic({ model, temperature, apiKey: process.env.ANTHROPIC_API_KEY });
  } else if (llmProvider.startsWith("gemini")) {
    llm = new Gemini({ model, temperature, apiKey: process.env.GOOGLE_API_KEY });
  } else {
    // Fallback to a default if the provider is unknown for some reason
    console.warn(`Unsupported LLM provider: ${llmProvider}. Defaulting to Gemini.`);
    llm = new Gemini({ model: "gemini-1.5-pro-latest", temperature, apiKey: process.env.GOOGLE_API_KEY });
  }
  return llm;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { input, node, settings } = body;

        if (!input || !node || !settings) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        // Use our new function that pulls from environment variables
        const llm = getLlmFromEnv(settings, node);
        
        let finalInput = typeof input === 'string' ? input : JSON.stringify(input);

        if (node.type === 'decision' && node.data.question) {
            finalInput = `Given the following information, answer the question with only "true" or "false".

Information:
${finalInput}

Question: ${node.data.question}`;
            const response = await llm.chat({
                messages: [{ role: "user", content: finalInput }]
            });

            const content: MessageContent = response.message.content;
            let textContent: string | null = null;

            if (typeof content === 'string') {
                textContent = content;
            } else if (Array.isArray(content)) {
                const textBlock = content.find(c => c.type === 'text');
                if (textBlock && 'text' in textBlock) {
                    textContent = textBlock.text;
                }
            }

            const result = textContent?.toLowerCase().trim();
            return NextResponse.json({ output: result === 'true' });
        }

        if (node.data.promptPrefix) {
            finalInput = `${node.data.promptPrefix}\n\n${finalInput}`;
        }

        const response = await llm.chat({
            messages: [{ role: "user", content: finalInput }]
        });
        
        return NextResponse.json({ output: response.message.content });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

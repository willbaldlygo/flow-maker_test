import { NextRequest, NextResponse } from "next/server";
import { getLlm } from "@/lib/llm-utils";
import { MessageContent } from "@llamaindex/core/llms";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { input, node, settings } = body;

        if (!input || !node || !settings) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        const llm = getLlm(settings, node);
        
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

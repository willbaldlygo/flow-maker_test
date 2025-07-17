import { NextRequest, NextResponse } from "next/server";
import { getLlm } from "@/lib/llm-utils";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { input, node, settings } = body;

        if (!input || !node || !settings) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        const llm = getLlm(settings, node);
        
        const response = await llm.chat({
            messages: [{ role: "user", content: typeof input === 'string' ? input : JSON.stringify(input) }]
        });
        
        return NextResponse.json({ output: response.message.content });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 

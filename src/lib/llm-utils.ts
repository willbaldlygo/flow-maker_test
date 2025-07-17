import { OpenAI } from "@llamaindex/openai";
import { Anthropic } from "@llamaindex/anthropic";
import { Gemini, GEMINI_MODEL } from "@llamaindex/google";
import { LLM } from "llamaindex";

export function getLlm(settings: any, nodeData: any = {}): LLM {
    const llmProvider = settings?.defaultLLM || "gpt-4o";
    let llm: LLM;
    let llmApiKey: string | undefined;

    const model = nodeData?.data?.model;
    const temperature = nodeData?.data?.temperature;

    if (llmProvider.startsWith("gpt")) {
        llmApiKey = settings?.apiKeys?.openai;
        llm = new OpenAI({
            model: model || "gpt-4.1-mini",
            temperature: temperature ?? 0.2,
            apiKey: llmApiKey
        });
    } else if (llmProvider.startsWith("claude")) {
        llmApiKey = settings?.apiKeys?.anthropic;
        llm = new Anthropic({
            model: model || "claude-sonnet-4-20250514",
            temperature: temperature ?? 0.2,
            apiKey: llmApiKey,
        });
    } else if (llmProvider.startsWith("gemini")) {
        llmApiKey = settings?.apiKeys?.google;
        llm = new Gemini({
            model: model || "gemini-pro",
            temperature: temperature ?? 0.2,
            apiKey: llmApiKey,
        });
    } else {
        throw new Error(`Unsupported LLM provider: ${llmProvider}`);
    }
    return llm;
} 

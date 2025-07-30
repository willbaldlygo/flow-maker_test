import { OpenAI } from "@llamaindex/openai";
import { Anthropic } from "@llamaindex/anthropic";
import { Gemini, GEMINI_MODEL } from "@llamaindex/google";
import { LLM } from "llamaindex";

export function getLlmModelName(settings: any, nodeData: any = {}): string {
  const llmProvider = nodeData?.data?.llm || settings?.defaultLLM || "gpt-4o";
  const model = nodeData?.data?.model;

  if (model) {
    return model;
  }

  if (llmProvider.startsWith("gpt")) {
    return "gpt-4.1-mini";
  } else if (llmProvider.startsWith("claude")) {
    return "claude-sonnet-4-20250514";
  } else if (llmProvider.startsWith("gemini")) {
    return "gemini-2.5-pro";
  } else {
    // Fallback to a default model if the provider is unknown
    return "gpt-4.1-mini";
  }
}

export function getLlm(settings: any, nodeData: any = {}): LLM {
  const llmProvider = nodeData?.data?.llm || settings?.defaultLLM || "gpt-4o";
  let llm: LLM;
  let llmApiKey: string | undefined;

  const model = getLlmModelName(settings, nodeData);
  const temperature = nodeData?.data?.temperature;

  if (llmProvider.startsWith("gpt")) {
    llmApiKey = settings?.apiKeys?.openai;
    llm = new OpenAI({
      model,
      temperature: temperature ?? 0.2,
      apiKey: llmApiKey,
    });
  } else if (llmProvider.startsWith("claude")) {
    llmApiKey = settings?.apiKeys?.anthropic;
    llm = new Anthropic({
      model,
      temperature: temperature ?? 0.2,
      apiKey: llmApiKey,
    });
  } else if (llmProvider.startsWith("gemini")) {
    llmApiKey = settings?.apiKeys?.google;
    llm = new Gemini({
      model: model as GEMINI_MODEL,
      temperature: temperature ?? 0.2,
      apiKey: llmApiKey,
    });
  } else {
    throw new Error(`Unsupported LLM provider: ${llmProvider}`);
  }
  return llm;
} 

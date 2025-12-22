import { config } from "dotenv";

config();

import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { LeadExtractSchema } from "./schemas";
import { Logger } from "@nestjs/common";

type LeadExtract = z.infer<typeof LeadExtractSchema>;
const logger = new Logger("ExtractActivity");

let cachedPrompt: ChatPromptTemplate | null = null;

export async function extractMetadata(
  emailBody: string,
  emailSubject: string,
): Promise<LeadExtract> {
  if (!process.env.LANGSMITH_API_KEY || !process.env.OPENAI_API_KEY) {
    const errMsg = "Missing API keys: LANGSMITH_API_KEY or OPENAI_API_KEY";
    logger.error(errMsg);
    throw new Error(errMsg);
  }

  const promptName = process.env.LANGSMITH_PROMPT_NAME;
  if (!promptName) {
    const errMsg = "Missing environment variable: LANGSMITH_PROMPT_NAME";
    logger.error(errMsg);
    throw new Error(errMsg);
  }

  if (!cachedPrompt) {
    try {
      cachedPrompt = await pull<ChatPromptTemplate>(promptName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error("Failed to fetch prompt", { error: errorMessage });
      throw new Error(`Failed to fetch prompt: ${errorMessage}`);
    }
  }

  try {
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const chain = cachedPrompt.pipe(model);
    const result = await chain.invoke({
      subject: emailSubject,
      text: emailBody,
    });

    const content =
      typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);
    const parsed: unknown = JSON.parse(content);
    const validated = LeadExtractSchema.parse(parsed);

    logger.log("Extraction successful", {
      inputLength: emailBody.length,
      extractedFields: Object.keys(validated).filter(
        (key) => validated[key as keyof typeof validated] !== null,
      ),
    });

    return validated;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error("Extraction failed", {
      error: errorMessage,
      inputLength: emailBody.length,
    });
    throw new Error(`Extraction failed: ${errorMessage}`);
  }
}

export async function persistMetadata(
  leadId: number,
  _metadata: LeadExtract,
): Promise<void> {
  logger.log("Persisting metadata", { leadId });
  await Promise.resolve();
  // TODO: Implement database persistence
}

export async function triggerCommunication(leadId: number): Promise<void> {
  logger.log("Triggering communication", { leadId });
  await Promise.resolve();
  // TODO: Implement communication trigger
}

export async function updateStatus(
  leadId: number,
  status: string,
): Promise<void> {
  logger.log("Updating status", { leadId, status });
  await Promise.resolve();
  // TODO: Implement status update
}

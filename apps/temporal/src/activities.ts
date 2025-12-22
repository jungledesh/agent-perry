import { config } from "dotenv";
config(); // Load .env early

import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { LeadExtractSchema } from "./schemas";
import { Logger } from "@nestjs/common";

type LeadExtract = z.infer<typeof LeadExtractSchema>;
const logger = new Logger("ExtractActivity");

// In-memory cache for the prompt (simple object; survives process lifetime)
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

  // Fetch prompt only if not cached
  if (!cachedPrompt) {
    try {
      // Use pull() instead of client._pullPrompt()
      // This automatically returns a PromptTemplate or ChatPromptTemplate instance
      cachedPrompt = await pull<ChatPromptTemplate>(promptName);

      logger.log("Prompt fetched from LangChain Hub", {
        commit: cachedPrompt.metadata?.lc_hub_commit_hash,
      });
    } catch (err) {
      logger.error(`Failed to fetch prompt: ${(err as Error).message}`);
      throw new Error(`Failed to fetch prompt: ${(err as Error).message}`);
    }
  }

  // --- NEW DEBUGGING BLOCK START ---
  // Format the prompt with inputs to inspect what the model will see
  try {
    const formattedMessages = await cachedPrompt.invoke({
      subject: emailSubject,
      text: emailBody,
    });

    // Log the full formatted messages (system + human)
    logger.log("Formatted prompt messages:", {
      messages: formattedMessages.messages.map((msg) => {
        const msgType = msg.constructor.name
          .replace("Message", "")
          .toLowerCase();
        const msgContent =
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content);
        return {
          type: msgType,
          content: msgContent,
        };
      }),
    });
  } catch (err) {
    logger.error(
      `Failed to format prompt for debugging: ${(err as Error).message}`,
    );
    // Continue anyway, but note the error
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
    logger.log(`this is result: `, result);

    // Parse JSON from the result content
    const content =
      typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);
    const parsed: unknown = JSON.parse(content);
    const validated = LeadExtractSchema.parse(parsed);
    logger.log(`Extraction successful for input length ${emailBody.length}`);

    // 4. Final validation
    return validated;
  } catch (err) {
    logger.error(`Extraction failed: ${(err as Error).message}`);
    throw new Error(`Extraction failed: ${(err as Error).message}`);
  }
}

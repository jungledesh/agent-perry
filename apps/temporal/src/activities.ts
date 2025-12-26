import { config } from "dotenv";

config();

import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { LeadExtractSchema } from "./schemas";
import { Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Prisma } from "@prisma/client";

type LeadExtract = z.infer<typeof LeadExtractSchema>;
const logger = new Logger("ExtractActivity");

let cachedPrompt: ChatPromptTemplate | null = null;

// Initialize Prisma client for direct database access
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || "file:../backend/dev.db",
  }),
});

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

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      const parseErrorMessage =
        parseError instanceof Error
          ? parseError.message
          : "Unknown parse error";
      logger.error("Failed to parse LLM response as JSON", {
        error: parseErrorMessage,
        content: content.substring(0, 200), // Log first 200 chars for debugging
      });
      throw new Error(
        `Failed to parse LLM response as JSON: ${parseErrorMessage}`,
      );
    }

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

export async function persistExtractedData(
  leadId: number,
  extractedData: LeadExtract,
): Promise<void> {
  logger.log("Persisting extracted data", { leadId });

  try {
    // Get current lead to check if provider needs updating
    const currentLead = await prisma.leads.findUnique({
      where: { id: leadId },
      select: { provider: true },
    });

    // Use extracted provider if manual one is "Unknown" or if extracted one exists
    const providerToUse =
      extractedData.provider &&
      (currentLead?.provider === "Unknown" || !currentLead?.provider)
        ? extractedData.provider
        : undefined;

    const updateData: Prisma.LeadsUpdateInput = {
      customer_name: extractedData.customer_name ?? undefined,
      customer_number: extractedData.customer_number ?? undefined,
      customer_address: extractedData.customer_address ?? undefined,
      service_requested: extractedData.service_requested ?? undefined,
      provider_lead_id: extractedData.provider_lead_id ?? undefined,
      ...(providerToUse && { provider: providerToUse }),
      ...(extractedData.lead_metadata && {
        lead_metadata:
          extractedData.lead_metadata as unknown as Prisma.InputJsonValue,
      }),
    };

    await prisma.leads.update({
      where: { id: leadId },
      data: updateData,
    });

    // Notify backend of update for WebSocket emission
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    try {
      await fetch(`${backendUrl}/leads/notify-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
    } catch (notifyErr) {
      // Don't fail the activity if notification fails
      logger.warn("Failed to notify backend of lead update", {
        leadId,
        error:
          notifyErr instanceof Error ? notifyErr.message : String(notifyErr),
      });
    }

    logger.log("Extracted data persisted successfully", { leadId });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to persist extracted data", {
      leadId,
      error: errorMessage,
    });
    throw new Error(`Failed to persist extracted data: ${errorMessage}`);
  }
}

export async function triggerCommunication(leadId: number): Promise<void> {
  logger.log("Triggering communication", { leadId });

  const commsWebhookUrl = process.env.COMMS_WEBHOOK_URL;
  if (!commsWebhookUrl) {
    logger.warn("COMMS_WEBHOOK_URL not set, skipping communication trigger", {
      leadId,
    });
    return;
  }

  try {
    // Get lead data to send to comms service
    const lead = await prisma.leads.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        customer_name: true,
        customer_number: true,
        customer_address: true,
        service_requested: true,
        status: true,
      },
    });

    // Get provider separately since it's required field
    const leadWithProvider = await prisma.leads.findUnique({
      where: { id: leadId },
      select: { provider: true },
    });

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    // Emit webhook/event to comms service
    const response = await fetch(commsWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "lead.processed",
        leadId: lead.id,
        data: {
          customer_name: lead.customer_name,
          customer_number: lead.customer_number,
          customer_address: lead.customer_address,
          service_requested: lead.service_requested,
          provider: leadWithProvider?.provider || "Unknown",
          status: lead.status,
        },
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Comms service returned ${response.status}: ${errorText}`,
      );
    }

    logger.log("Communication triggered successfully", { leadId });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to trigger communication", {
      leadId,
      error: errorMessage,
    });
    // Don't throw - communication failure shouldn't fail the workflow
    // Just log the error and continue
  }
}

export async function updateStatus(
  leadId: number,
  status: string,
): Promise<void> {
  logger.log("Updating status", { leadId, status });

  try {
    await prisma.leads.update({
      where: { id: leadId },
      data: { status },
    });

    // Notify backend of update for WebSocket emission
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    try {
      await fetch(`${backendUrl}/leads/notify-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
    } catch (notifyErr) {
      // Don't fail the activity if notification fails
      logger.warn("Failed to notify backend of lead update", {
        leadId,
        error:
          notifyErr instanceof Error ? notifyErr.message : String(notifyErr),
      });
    }

    logger.log("Status updated successfully", { leadId, status });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to update status", {
      leadId,
      status,
      error: errorMessage,
    });
    throw new Error(`Failed to update status: ${errorMessage}`);
  }
}

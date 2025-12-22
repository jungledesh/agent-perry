import * as activities from "./activities";
import { LeadExtractSchema } from "./schemas";
import { proxyActivities, log } from "@temporalio/workflow";
import { WorkflowError } from "@temporalio/workflow";

const {
  extractMetadata,
  persistExtractedData,
  triggerCommunication,
  updateStatus,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 seconds",
  retry: {
    maximumAttempts: 3,
    initialInterval: "1s",
  },
});

export async function processLead({
  leadId,
  emailBody,
  emailSubject,
}: {
  leadId: number;
  emailBody: string;
  emailSubject: string;
}): Promise<void> {
  try {
    if (typeof leadId !== "number" || leadId <= 0) {
      throw new Error("Invalid lead ID");
    }

    log.info("Processing lead", { leadId });

    const extracted = await extractMetadata(emailBody, emailSubject);
    const validated = LeadExtractSchema.parse(extracted);

    // Alert if customer phone number is missing
    if (!validated.customer_number) {
      log.warn("Alert: Missing customer phone number", { leadId });
      console.warn(`[ALERT] Lead ${leadId}: Customer phone number is missing`);
    }

    // Activity 2: Persist extracted data in DB
    await persistExtractedData(leadId, validated);

    // Activity 3: Trigger communication
    await triggerCommunication(leadId);

    // Activity 4: Update status to processed
    await updateStatus(leadId, "processed");

    log.info("Lead processed successfully", {
      leadId,
      extractedFields: Object.keys(validated).filter(
        (key) => validated[key as keyof typeof validated] !== null,
      ),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Lead processing failed", {
      leadId,
      error: errorMessage,
    });

    // Update status to failed before throwing
    try {
      await updateStatus(leadId, "failed");
    } catch (statusError) {
      log.error("Failed to update status to failed", {
        leadId,
        error:
          statusError instanceof Error
            ? statusError.message
            : String(statusError),
      });
    }

    throw new WorkflowError(
      `Workflow failed for lead ${leadId}: ${errorMessage}`,
    );
  }
}

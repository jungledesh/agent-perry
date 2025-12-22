import * as activities from "./activities";
import { LeadExtractSchema } from "./schemas";
import { proxyActivities, log } from "@temporalio/workflow";
import { WorkflowError } from "@temporalio/workflow";
const { extractMetadata } = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 seconds",
  retry: {
    maximumAttempts: 3,
    initialInterval: "1s", // Temporal uses strings or ms
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

    log.info("Lead processed successfully", {
      leadId,
      extractedFields: Object.keys(validated).filter(
        (key) => validated[key as keyof typeof validated] !== null,
      ),
    });

    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Lead processing failed", {
      leadId,
      error: errorMessage,
    });
    throw new WorkflowError(
      `Workflow failed for lead ${leadId}: ${errorMessage}`,
    );
  }
}

import * as activities from "./activities";
import { LeadExtractSchema } from "./schemas";
import { proxyActivities, log } from "@temporalio/workflow";
import { WorkflowError } from "@temporalio/workflow"; // For custom failures

// Define options HERE
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
    // Sanitize input (basic; expand for security)
    if (typeof leadId !== "number" || leadId <= 0)
      throw new Error("Invalid lead ID");

    log.info(`Processing lead ${leadId}`);

    // Activity 1: Extract with LangSmith
    const extracted = await extractMetadata(emailBody, emailSubject);

    // Workflow step: Validate with Zod
    const validated = LeadExtractSchema.parse(extracted); // Throws if invalid

    log.info("`Validated data: ", { validated });

    // // Activity 2: Persist in DB
    // await activities.persistMetadata(leadId, validated);

    // // Activity 3: Trigger comms
    // await activities.triggerCommunication(leadId);

    // // Activity 4: Update status
    // await activities.updateStatus(leadId, "processed");
  } catch (error) {
    log.error(`Lead ${leadId} failed: ${error.message}`); // Sanitized logging (no full stack)
    console.warn(`Alert: Lead ${leadId} failed - ${error.message}`); // Dummy alert
    throw new WorkflowError(`Workflow failed for lead ${leadId}`); // Custom failure for Temporal UI/monitoring
  }
}

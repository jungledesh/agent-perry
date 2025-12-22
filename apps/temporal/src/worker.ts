import { Worker } from "@temporalio/worker";
import * as activities from "./activities";

const taskQueue = process.env.TASK_QUEUE || "lead-processing";

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve("./workflows"),
    activities,
    taskQueue,
  });

  console.log(`Worker started on task queue: ${taskQueue}`);

  await worker.run();
}

run().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});

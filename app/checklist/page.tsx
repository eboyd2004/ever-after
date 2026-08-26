import { ChecklistWorkspaceView } from "@/src/components/workspace/workspace-destinations";
import { measurePerformance } from "@/src/server/logging/performance";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  return measurePerformance("checklist.page.total", async () => (
    <ChecklistWorkspaceView />
  ));
}

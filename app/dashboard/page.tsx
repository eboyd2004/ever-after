import { DashboardWorkspaceView } from "@/src/components/workspace/workspace-destinations";
import { measurePerformance } from "@/src/server/logging/performance";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  return measurePerformance("dashboard.page.total", async () => (
    <DashboardWorkspaceView />
  ));
}

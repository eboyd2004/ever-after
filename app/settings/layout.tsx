import type { ReactNode } from "react";

import { SettingsNavigation } from "@/src/components/settings/settings-navigation";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      <SettingsNavigation />
      {children}
    </div>
  );
}
